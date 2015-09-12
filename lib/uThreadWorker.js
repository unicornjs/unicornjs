/*************************************************
 File:      uThreadWorker.js
 Project:   uThread
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var unicorn = {},
    cluster = {},
    config = {};

module.exports = function(serviceName, unicornInject, clusterInject, configInject) {
    unicorn = unicornInject;
    cluster = clusterInject;
    config = configInject
    uThreadWorker = {};

    console.log('Worker included');

    // Recieve message, send it as event so service code, and return it to the master
    process.on('message', function(message){
        unicorn.message(message.data, function(message){
            process.send(unicorn.ipcMessage('NORMAL', message));
        });
    });

    return uThreadWorker;
}