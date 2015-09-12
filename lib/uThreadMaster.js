/*************************************************
 File:      uThreadMaster.js
 Project:   uThread
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var unicorn = {}
    cluster = {},
    config = {},
    uTalk = {},
    redis = {},
    uBalancer = {};


function spawnAllWorkers() {
    for (var i = 0; i <= config.cluster.threads; i++) {
        uBalancer.addThread(spawnWorker());
    }

    // Activate the unicorn after all threads are there, should probably be the ready function and needs some fancy promising or such
    unicorn.activate();
}

function spawnWorker(callback) {
    var tmpThread = cluster.fork();

    tmpThread.on('message', function(msg) {
        //This responds the message to the response channel
        uTalk.sendAnswer(msg.data, msg.data.data);
    });

    // If we have a call back, use it, otherwise return
    if(typeof(callback) == 'function') callback(tmpThread);
    else return tmpThread;
}

function handleServiceMsg(msg) {
    // Handle the service stuff

    msg.request.function = 'pong';
    msg.ack = 1;

    uTalk.sendServiceMessage(msg);

}

module.exports = function(serviceName, unicornInject, clusterInject, configInject) {
    unicorn = unicornInject;
    unicorn.spawnWorker = spawnWorker;

    cluster = clusterInject;
    config = configInject;
    uTalk = unicorn.uTalk;
    redis = unicorn.redis;
    uBalancer = require(unicorn.path + '/lib/uThreadBalancer.js')(unicorn, config);

    console.log('Master included');

    var channel;

    unicorn.masterReady();

    uTalk.init(serviceName, process.pid).then(function (channel) {
        assignedChannel = channel;
        console.log('(' + serviceName + ')Channel assigned: %s',assignedChannel);

        uTalk.listen(assignedChannel, function (msg) {
            // Get a thread from the balancer and send the message to that thread

            if(msg.type == 'SERVICE'){
                // Do service stuff here
                handleServiceMsg(msg);
            } else {
                uBalancer.roundRobin().send(unicorn.ipcMessage('NORMAL', msg));
                //uBalancer.random().send(msg);
            }
        })
    })

    uThreadMaster = {};

    // Start all the threads
    spawnAllWorkers();

    // Handle crashes from workers and dirty exits
    cluster.on('exit', function(worker, code, signal) {
        if (typeof(workers[worker.process.pid]) != 'undefined') { // Worker crashed and didn't shut down gracefully
            // Put a message on stdout
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);

            if(Object.keys(workers).length <= config.cluster.threads) { // Remove worker and spawn a new one
                console.log('Less workers than minimum spawning a new one; workers:' + Object.keys(workers).length);
                uBalancer.delThread(worker.process.pid);
                uBalancer.addThread(spawnWorker());
            } else { // Just remove the worker
                console.log('More workers than minimum just delete this worker; workers:' + Object.keys(workers).length);
                uBalancer.delThread(worker.process.pid);
            }
        } else { // Worker had a gracefull shutdown, we will start a new worker instead if we need more workers
            if(Object.keys(workers).length < config.cluster.threads) {
                console.log('Gracefull shutdown spawning new worker; workers:' + Object.keys(workers).length);
                uBalancer.addThread(spawnWorker());
            } else {
                console.log('Gracefull shutdown dont need a new worker; workers:' + Object.keys(workers).length);
            }
        }
    });

    return uThreadMaster;
}