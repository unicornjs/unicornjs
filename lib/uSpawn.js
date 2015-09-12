/*************************************************
 File:      spawn.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var Spawn = require('child_process').spawn;
var unicorn = {};
var config = {};

/*
 Use this to spawn math service
 */
function math(){

    // Like run the test before we start a broker or service bla

    return new unicorn.promise(function(resolve, reject){

        var service = Spawn('node', [unicorn.path + '/spawn.js', config.unicornPath + '/config.json', 'uMath']);

        // Print data on the console when data comes in
        service.stdout.on('data', function (data) {
            // Replace newlines, because data is a buffer and will print a newline for free
            console.log(data.toString().replace(/^\s+|\s+$/g, ''));
        });

        // Print errors on the console when errors comes in
        service.stderr.on('data', function (data) {
            // Replace newlines, because data is a buffer and will print a newline for free
            console.log(data.toString().replace(/^\s+|\s+$/g, ''));
        });

        // Print info when a process exits
        service.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });

        // Print info when a process exits
        service.on('exit', function (code) {
            console.log('Dirty child process exit with code ' + code);
        });

        service.on('error', function (err) {
            console.log('Child process error: ' + err);
        });

        resolve({service:service, name:service.name, pid:service.pid});
    });
}

/*
 Use this to spawn a broker
 */
function broker(){

    // Like run the test before we start a broker or service bla

    return new unicorn.promise(function(resolve, reject){

        var broker = Spawn('node', [unicorn.path + '/spawn.js', config.unicornPath + '/config.json', 'uBroker']);

        // Print data on the console when data comes in
        broker.stdout.on('data', function (data) {
            // Replace newlines, because data is a buffer and will print a newline for free
            var procData = data.toString().replace(/^\s+|\s+$/g, '');

            // See if we have a system message first, since we cannot use process.send we use std for messaging
            if(procData == 'INITDONE') {
                resolve({service:broker, name:broker.name, pid:broker.pid});
            } else {
                console.log(procData);
            }
        });

        // Print errors on the console when errors comes in
        broker.stderr.on('data', function (data) {
            // Replace newlines, because data is a buffer and will print a newline for free
            console.log(data.toString().replace(/^\s+|\s+$/g, ''));
        });

        // Print info when a process exits
        broker.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });
    });
}

/*
 Use this to spawn a service
 */
function service(servicename){
    // TODO: Load config from redis, so we can use it in our service
    var config = {};

    var system = {
        start:function(){
            // Code here
        }
    }

    return system;
}

module.exports = function(unicornInject) {
    unicorn = unicornInject;
    config = unicorn.config.get();

    return {
        service:service,
        broker:broker,
        math:math
    }
}