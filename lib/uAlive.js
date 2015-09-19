/*************************************************
 File:      uAlive.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

/* Required packages */
var redis = {},
    extend = require('extend-object'),

/* Global Variables */
    config = {},
    msgModule = {},
    unicorn = {},
    uServices = {},
    uSleepServices = {},
    uAboutToDieServices = {},
    listenClient = {};

var client = {};

module.exports = function(unicornInject) {
    unicorn = unicornInject;
    config = unicorn.config.get();
    redis = unicorn.redis;
    msgModule = unicorn.uMessage;
    client = redis.createClient(config.redis[0].port, config.redis[0].server);
    listenClient = redis.createClient(config.redis[0].port, config.redis[0].server);
    listen2Client = redis.createClient(config.redis[0].port, config.redis[0].server);

    uServicesManager();

    var service = {
        ping: function () {
            setInterval(function () {
                console.log(uServices);
                for (var k in uServices) {
                    for (var j = 0; j < uServices[k].length; j++) {
                        var msg = msgModule.create('broker', process.pid);
                        msg.respondChannel = 'uBroker';
                        msg.request.service = uServices[k][j].channel;
                        msg.request.function = 'ping';
                        msg.type = 'SERVICE';
                        client.publish(uServices[k][j].channel, JSON.stringify(msg));
                    }
                }
                updateServices();
                //uSleepServicesManager();

            }, 1000);
        },

        pong: function (msg) {

            if (msg.ack == 1 && msg.request.function == 'pong') {
                // keep the service alive
                for (var k in uServices) {
                    for (var j = 0; j < uServices[k].length; j++) {
                        if (uServices[k][j].channel == msg.request.service) {
                            uServices[k][j].timestamp = (new Date()).getTime();
                            client.set('uServices', JSON.stringify(uServices));
                            // Publish that it did an update
                            client.publish('uServicesChannel', 'UPDATE');
                        }
                    }
                }
            } else {
                // resend the msg or smt like that
            }
        }
    };

    return service;
};


function updateServices () {

 //TODO if timestamp is too old the service is dead
 var change = false;

 //Improve this logic
 var now = (new Date()).getTime();

 for (var k in uServices) {
  var servicesAlive = [];
  for (var j = 0; j < uServices[k].length; j++) {
   if (( now - uServices[k][j].timestamp ) < 2000) {
    servicesAlive.push(uServices[k][j]);
    change = true;
   } else if (( now - uServices[k][j].timestamp ) < 3000) {
       //addService(k,uServices[k][j], uSleepServices);
       //servicesAlive.push(uServices[k][j]);
   }

  }
  uServices[k] = servicesAlive;
 }

 if (change == true) {
  //// Publish that it did an update
  client.set('uServices', JSON.stringify(uServices));
  client.publish('uServicesChannel', 'UPDATE');
  //console.log('uServices UPDATE ', uServices);
 }
}

function updateSleepServices () {

    //TODO if timestamp is too old the service is dead
    var change = false;

    //Improve this logic
    var now = (new Date()).getTime();

    for (var k in uSleepServices) {
        var servicesAlive = [];
        for (var j = 0; j < uSleepServices[k].length; j++) {
            if (( now - uSleepServices[k][j].timestamp ) < 3000) {
                servicesAlive.push(uSleepServices[k][j]);
                change = true;
            } else if (( now - uSleepServices[k][j].timestamp ) < 7000) {
                addService(k,uSleepServices[k][j], uAboutToDieServices);
                //servicesAlive.push(uServices[k][j]);
            }

        }
        uServices[k] = servicesAlive;
    }

    if (change == true) {
        //// Publish that it did an update
        client.set('uServices', JSON.stringify(uServices));
        client.publish('uServicesChannel', 'UPDATE');
        //console.log('uServices UPDATE ', uServices);
    }
}

/**
 * Worker Logic
 * I want this to listen always
 * Listen for UPDATE in the uServices object
 */
function uServicesManager(){

 client.publish('uServicesChannel', 'UPDATE');

 listenClient.on('message', function(channel, message) {

  client.get('uServices', function(err, reply) {
   if (reply !== null) {
    uServices = JSON.parse(reply);
   }
  });
 });

 listenClient.on("error", function (err) {
  console.log("Redis listen "+ err);
  listenClient.quit();
 });

 listenClient.subscribe('uServicesChannel');
}


function uSleepServicesManager(){

    client.publish('uSleepServicesChannel', 'UPDATE');

    listen2Client.on('message', function(channel, message) {

        client.get('uSleepServices', function(err, reply) {
            if (reply !== null) {
                uSleepServices = JSON.parse(reply);
            }
        });
    });

    listen2Client.on("error", function (err) {
        console.log("Redis listen "+ err);
        listen2Client.quit();
    });

    listen2Client.subscribe('uSleepServicesChannel');
}

//function uAboutToDieServicesManager(){
//
//    client.publish('uAboutToDieServicesChannel', 'UPDATE');
//
//    listenClient.on('message', function(channel, message) {
//
//        client.get('uAboutToDieServices', function(err, reply) {
//            if (reply !== null) {
//                uAboutToDieServices = JSON.parse(reply);
//            }
//        });
//    });
//
//    listenClient.on("error", function (err) {
//        console.log("Redis listen "+ err);
//        listenClient.quit();
//    });
//
//    listenClient.subscribe('uAboutToDieServicesChannel');
//}
//
///**
// * Receive a service name and an object and stored it redis
// * @addService
// * @param service {String}
// * @param serviceObject {Object}
// * @param uServiceList
// */
//function addService(service, serviceObject, uServiceList){
//
//    client.get(uServiceList, function(err, reply) {
//
//        console.log('//////////////////////////////////////////'+reply);
//
//        if (reply == null){
//            //extend this object
//            //add a key with service name and value service channel
//            //this is the first service i should activate it
//            var newObjectToPush = JSON.parse('{"' + service + '": []}');//found a fancy way to make this
//            newObjectToPush[service].push(serviceObject);
//
//            extend(uServices, newObjectToPush);
//
//            setAndPublish('uServices',uServices,uServiceList+'Channel', 'UPDATE')
//
//        } else {
//            uServiceList = JSON.parse(reply);
//            if (typeof(uServiceList[service]) !== 'undefined') {
//
//                var uService = uServiceList[service];
//                uService.push(serviceObject);
//                //save the new uServices
//                uServiceList[service] = uService;
//
//                setAndPublish(uServiceList,uServiceList,uServiceList+'Channel', 'UPDATE')
//
//            } else {
//                //extend this object
//                //add a key with service name and value service channel
//                var stringObject = '{"' + service + '": []}'; //found a fancy way to make this
//                var objectToPush = JSON.parse(stringObject);
//                objectToPush[service].push(serviceObject);
//                extend(uServiceList, objectToPush);
//
//                setAndPublish(uServiceList,uServiceList,uServiceList+'Channel', 'UPDATE')
//            }
//        }
//    });
//}
//
//
//function setAndPublish(variableName, object, channel, option){
//
//    client.set(variableName, JSON.stringify(object));
//    // Publish that it did an update
//    client.publish(channel, option);
//}
