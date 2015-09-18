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

/* Global Variables */
    config = {},
    msgModule = {},
    unicorn = {},
    uServices = {},
    uActiveServices = {},
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
   if (( now - uServices[k][j].timestamp ) < 7000) {
    servicesAlive.push(uServices[k][j]);
    change = true;
   }
   //else if (( now - uServices[k][j].timestamp ) < 2000) {
   //    //servicesAlive.push(uServices[k][j]);
   //    change = true;
   //} else if (( now - uServices[k][j].timestamp ) < 4000) {
   //    //servicesAlive.push(uServices[k][j]);
   //    change = true;
   //}

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