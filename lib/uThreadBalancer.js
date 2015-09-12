/*************************************************
 File:      uThreadBalancer.js
 Project:   uThread
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/


var unicorn = {},
    config = {},
    workers = {},
    pids = [],
    rrCounter = 0;

/*
Add a thread
 */
function addThread(thread) {
    pids.push(thread.process.pid);
    workers[thread.process.pid] = thread;
}

/*
 Delete a thread
 */
function delThread(pid) {
    //Delete worker entry from worker

    delete workers[pid];

    //Remove pid from pid array
    var position = pids.indexOf(pid);
    if (~position) pids.splice(position, 1);

    //Reset array index
    pids = pids.filter(function(){return true;});
}

/*
 Do round robin balancing
 */
var roundRobin = function(){
    if (pids.length > 0) { // Check if we have workers to balance to
        if (++rrCounter > (pids.length - 1)) rrCounter = 0;
        // Forward the message to the next available worker
        return workers[pids[rrCounter]];
        console.log('Sending message to: ' + pids[rrCounter], message);
    } else { // No workers up
        // Try to spawn a new worker if the number of workers didn't exceed the max threads value
        console.log('No workers available try to spawn one for you; workers:' + Object.keys(workers).length);
        if(Object.keys(workers).length < config.cluster.maxThreads) {
            console.log('I can spawn, spawning now; workers:' + Object.keys(workers).length);
            unicorn.spawnWorker(function(thread){
                if (rrCounter > (pids.length - 1)) rrCounter = 0;
                // Forward the message to the new available worker
                return workers[thread.process.pid];
            });
        } else {
            console.log('Cant spawn and no workers available; workers:' + Object.keys(workers).length);
        }
    };
}

/*
 Do random balancing
 */
var random = function(){
    // Return random thread
    return workers[pids[~~(Math.random() * pids.length)]];
}

/*
 Balance to the thread that has the least load at that moment
 */
var loadAware = function(){
    return threads[0];
}

module.exports = function (unicornInject, configInject) {
    unicorn = unicornInject;
    config = configInject;

    return {
        roundRobin:roundRobin,
        random:random,
        loadAware:loadAware,
        addThread:addThread,
        delThread:delThread
    }
}