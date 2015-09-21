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
 Use this to spawn math service (DEPRICATED)
 */
function math(){
    // Like run the test before we start a broker or service bla
    console.log('DEPRICATION WARNING -> Old uMath function in uSpawn.js called, this function will be removed in next version');
    // Forward the promise, this is a bit hacky but the function will be removed
    spawnService('uMath', 'coreService', false).then(function(msg){
        return new unicorn.promise(function(resolve, reject){
            resolve(msg);
        });
    });
}

/*
 Use this to spawn a broker (DEPRICATED)
 */
function broker(){
    // Like run the test before we start a broker or service bla
    console.log('DEPRICATION WARNING -> Old broker function in uSpawn.js called, this function will be removed in next version');
    // Forward the promise, this is a bit hacky but the function will be removed
    return new unicorn.promise(function(resolve, reject){
        spawnService('uBroker', 'coreService', true).then(function(msg){
            resolve(msg);
        });
    });
}

/*
 Global spawn service
 */
function spawnService(serviceName, type, initWait) {
    // Type can be either service or coreService
    // When coreService, a service from the core-service folder will be spawned
    type = type || 'service';

    // If init wait is set, we will wait for the INITDONE signal before resolving the promise
    initWait = initWait || false;

    // Load the service and return a promise
    return new unicorn.promise(function(resolve, reject){

        if(typeof(serviceName) == 'undefined') reject({msg:'No service name'});

        try {
            // We must fix the hardcoded config path.. or maybe not
            // Maybe change the name of the config to unicorn config and make this default
            var service = Spawn('node', [unicorn.path + '/spawn.js', config.unicornPath + '/config.json', serviceName, type]);

            // Print errors on the console when errors comes in
            service.stderr.on('data', function (data) {
                // Replace newlines, because data is a buffer and will print a newline for free
                console.log(data.toString().replace(/^\s+|\s+$/g, ''));
            });

            // Print info when a process exits
            service.on('close', function (code) {
                console.log('Child process: ' + serviceName + ' exited with code ' + code);
            });

            // Print info when a process exits
            service.on('exit', function (code) {
                console.log('Dirty child process: ' + serviceName + ' exit with code ' + code);
            });

            service.on('error', function (err) {
                console.log('Child process: ' + serviceName + ' error: ' + err);
            });

            // Switch the moment of the resolve, if initWait is enabled we must wait for a return signal
            if(initWait) {
                // Print data on the console when data comes in
                service.stdout.on('data', function (data) {
                    // Replace newlines, because data is a buffer and will print a newline for free
                    var procData = data.toString().replace(/^\s+|\s+$/g, '');

                    // See if we have a system message first, since we cannot use process.send we use std for messaging
                    if (procData == 'INITDONE') {
                        resolve({service: broker, name: broker.name, pid: broker.pid});
                    } else {
                        console.log(procData);
                    }
                });
            } else {
                // Print data on the console when data comes in
                service.stdout.on('data', function (data) {
                    // Replace newlines, because data is a buffer and will print a newline for free
                    console.log(data.toString().replace(/^\s+|\s+$/g, ''));
                });

                resolve({service:service, name:service.name, pid:service.pid});
            }
        } catch (err) {
            reject(err);
        }

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
        math:math,
        spawnService:spawnService
    }
}