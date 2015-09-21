/*************************************************
 File:      unicorn.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var defaultConfig = {};

/*
 The unicorn object is a special object it will be passed to all services, threads, etc.
 This object will contain the redis connections etc.
 */
var unicorn = {
    path:__dirname,
    redis:{},
    config:{},
    xtend:{},
    promises:{},
    uMessage:{},
    uTalk:{},
    uBroker:{},
    uAlive: {}
};

// Add 3rd party libs first
unicorn.redis = require('redis');
unicorn.xtend = require('xtend');
unicorn.promise = require('es6-promise').Promise;
unicorn.uMessage = require('./lib/uMessage.js')(unicorn);

// Add our own libs that need the unicorn object
unicorn.config = require('./lib/uConfig.js')(unicorn);

// Event function arrays
var readyFunctions = [],
    activeFunctions = [],
    maintenanceFunctions = [],
    threadReadyFunctions = [],
    masterReadyFunctions = [],
    messageFunctions = [],
    messageSyncFunctions = [],
    stopFunctions = [],
    exitFunctions = [];

/*
The unicorn system exposes the whole system, with all functionality, it also has the option to start, stop and pause unicorn
You will need this future at least once per server you are running
 */
exports.system = function(config){
    // TODO: test if we have a redis server available else throw error and quit
    // TODO: use xtend to merge default config and user config to prevent errors and make sure we have a minimal configuration
    // TODO: Save the config to redis so other services and modules can use the config

    var path = require('path');

    config.unicornPath = path.dirname(process.mainModule.filename);

    console.log('unipath: ' + config.unicornPath);

    // Initialise the config
    unicorn.config.init(config).then(function (done) { // resolve
        // When the init is done
        unicorn.uAlive = require('./lib/uAlive.js')(unicorn);
        console.log('config promise returned!');
        readyFunctions.map(function(func){
            func();
        });
    }, function (err) { //reject

    });

    unicorn.services = [];

    var system = {
        on:function(action, func) {
            switch(action) {
                case "ready":
                    readyFunctions.push(func);
                    break;
            }
        },
        start:function() {
            // Start the unicorn

            unicorn.uSpawn = require('./lib/uSpawn.js')(unicorn);

            console.log('Spawning broker now');

            // Always spawn a broker first. The unicorn can't run with 0 brokers
           unicorn.uSpawn.spawnService('uBroker', 'coreService', true).then(function(mainBroker){
               unicorn.services.push(mainBroker);

               console.log('First broker there, lets spawn the math service');
               for(var i=0; i < config.brokers.amount-1; i++){
                   unicorn.uSpawn.spawnService('uBroker', 'coreService', true).then(function(broker) {
                       unicorn.services.push(broker);
                   });
               }

               config.services.map(function(service){
                   for(var i=0; i < service.amount; i++) {
                       unicorn.uSpawn.spawnService(service.serviceName, service.type, config.initWait).then(function (service) {
                           unicorn.services.push(service);
                       });
                   };
               });

           });

            //TODO this should not be here - ping
            setTimeout(function () {
                console.log('Starting unicorn ping!');
                unicorn.uAlive.ping();
            }, 3000);

        }
    };

    return system;
};

/*
The service is a subset that you need to create a service, it will expose all client and service functions
It will have handles to create a multi-threaded service
 */
exports.service = function(config){

    // Initialise the config
    unicorn.config.init(config).then(function (done) { // resolve
        // When the init is done
        readyFunctions.map(function(func){
            func();
        });

    }, function (err) { //reject

    });

    // TODO: Load config from redis, so we can use it in our service
    var config = {};

    var service = {
        on: function (action, func, method) {
            switch (action) {
                case "ready":
                    readyFunctions.push(func);
                    break;

                case "threadReady":
                    threadReadyFunctions.push(func);
                    break;

                case "masterReady":
                    masterReadyFunctions.push(func);
                    break;

                case "active":
                    activeFunctions.push(func);
                    break;

                case "maintenance":
                    maintenanceFunctions.push(func);
                    break;

                case "message":
                    if(typeof(method) == 'undefined') method = '';
                    messageFunctions.push([func, method]);
                    console.log('Added on function');
                    break;

                case "messageSync":
                    messageSyncFunctions.push(func);
                    break;

                case "stop":
                    stopFunctions.push(func);
                    break;

                case "exit":
                    exitFunctions.push(func);
                    break;
            }
        },
        activate: function () {
            activeFunctions.map(function (func) {
                func();
            });
        },
        ready: function () {
            readyFunctions.map(function (func) {
                func();
            });
        },
        threadReady: function () {
            threadReadyFunctions.map(function (func) {
                func();
            });
        },
        masterReady: function () {
            masterReadyFunctions.map(function (func) {
                func();
            });
        },
        maintenance: function () {
            maintenanceFunctions.map(function (func) {
                func();
            });
        },
        message: function (message, respond) {
            // Switch method here and only call functions that have the same method
            messageFunctions.map(function (func) {
                if(func[1] == message.request.function) {
                    func[0](message, respond);
                }
            });
        },
        stop: function () {
            stopFunctions.map(function (func) {
                func();
            });
        },
        exit: function () {
            exitFunctions.map(function (func) {
                func();
            });
        },
        redis: unicorn.redis,
        promise: unicorn.promise,
        uMessage: unicorn.uMessage,
        config: unicorn.config,
        uTalk: unicorn.uTalk,
        uAlive: unicorn.uAlive
    };

    return service;
};

/*
The client exposes basic functions, you can use this in your project and call services withing unicorn
The only things this should expose are sendMessage, validateMessage, and createMessage
 */
exports.client = function(config){

    // Initialise the config
    unicorn.config.init(config).then(function (done) { // resolve
        // When the init is done
        console.log('Client ready');

        // Release the config update channel, we don't need it for clients
        unicorn.config.release();

        readyFunctions.map(function(func){
            func();
        });
    }, function (err) { //reject
        console.log(err);
    });

    var client = {
        on: function (action, func) {
            switch (action) {
                case "ready":
                    readyFunctions.push(func);
                    break;
            }
        },
        redis: unicorn.redis,
        promise: unicorn.promise,
        uMessage: unicorn.uMessage,
        config: unicorn.config,
        uTalk: require('./lib/uTalk.js')(unicorn, true)
    };

    return client;
};