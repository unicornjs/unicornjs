/*************************************************
 File:      uBroker.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

/* Required packages */
var unicorn = {},
    config = {},
    redis = {},
    msgModule = {},
    uAlive = {},
    xtend = {},
    client = {};

/* Global Variables */
var uBrokers = {"brokers" : []},
    uServices = {};


module.exports = function(unicornInject) {
    unicorn = unicornInject;
    config = unicorn.config.get();
    redis = unicorn.redis;
    msgModule = unicorn.uMessage;
    uAlive = unicorn.uAlive;
    xtend = unicorn.xtend;

    client = redis.createClient(config.redis[0].port, config.redis[0].server);

    unicorn.on('active', function(){
        console.log('I am active now');
    });

    unicorn.on('masterReady', function(){
        console.log('Broker master ready now');
        client = redis.createClient(config.redis[0].port, config.redis[0].server);

        uServicesManager(); //Initialize and populate uServices variable
        brokerLogic();

        setTimeout(function () {
            console.log('about ping');
            unicorn.uAlive.ping();
        }, 3000);

    });
};

// Exit clean from redis
process.on('exit', function() {
    console.log('Broker %s is down', process.pid);
    process.exit(0);
});


function brokerLogic() {

    var listenClient = redis.createClient(config.redis[0].port, config.redis[0].server);
    var client2 = redis.createClient(config.redis[0].port, config.redis[0].server);
    //var watcher = redis.createClient(config.redis[0].port, config.redis[0].server);
    //
    //watcher.config("SET","notify-keyspace-events", "KEA");
    //
    //watcher.on('message', function(channel, action) {
    //    if (action === 'rpush') {
    //        console.log('RPUSH');
    //        messageHandler();
    //    }
    //});
    //watcher.subscribe( "__keyspace@0__:uBrokerMessages", function (err) {
    //    next();
    //});
    console.log('Broker is up!');

    // Catch redis errors
    listenClient.on('error', function (error) {
        console.log('listenClient error: %s', error)
    });

    // Catch redis message
    listenClient.on("message", function (channel, message) {
        var msg;
        try {
            msg = JSON.parse(message);
            msg = msgModule.verify(msg); // TODO catch or check this validation validation of the message
            // Set broker in the chain
            msg.trackingChain.push({"service": "uBroker_" + process.pid, "timestamp": (new Date()).getTime()});
            //Asking for a channel
            if (msg.type == 'SERVICE') {
                //I have a pong msg for the moment, this should be a switch case and call the respective function
                uAlive.pong(msg);
            } else {
                //Normal message
                messageHandler(client2);
            }
        } catch (e) {
            console.log(e);
        }
    });
    listenClient.subscribe('uBroker');
}

function uServicesManager(){

    var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server);

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
    });

    listenClient.subscribe('uServicesChannel');
}

function uBrokersManager(){
    var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server);

    listenClient.on("error", function (err) {
        console.log("Redis listen error " + err);
    });

    listenClient.on('message', function(channel, message) {
        client.get('uBrokers', function(err, reply) {
            uBrokers = JSON.parse(reply);
        });
    });

    listenClient.subscribe('uBrokersChannel');
}

/**
 * Select a service to assign a job and activate the next service
 * @param service
 * @returns {*}
 */
function selectService (service){

    if(typeof(uServices[service]) !== 'undefined'){
        if (uServices[service].length !== 0 ) {
            var uService = uServices[service], //array
                activeuService = uService[0];
            // the first service should be active but if is not, should look for an active one
            if (activeuService.status == 0) {
                var foundOne = false;
                for ( var i = 0 ; i < uService.length ; i++ ){
                    if ( foundOne == false && uService[i].status == 1 ) {
                        activeuService = uService[i];
                        foundOne = true;
                    }
                }
                //if there is not active service just stay whith the first one
            }

            activeuService.status = 0;     //change state to busy
            uService.shift();              //take the service out of the list
            uService.push(activeuService); // pushing the service at the end of the list
            uService[0].status = 1;        //activate other service
            //save the new uServices
            uServices[service] = uService;

            // changing the variable on redis
            client.set('uServices', JSON.stringify(uServices));
            // Publish that it did an update
            client.publish('uServicesChannel', 'UPDATE');
            return activeuService;

        } else {
            //not services availables and return error to the broker
            console.log('Not services %s available', service);
            return 'Not services '+service+' available'
        }
    } else {
        return "not services with name "+service; // return an error cause there are no services with that name
    }
}

/**
 * Receive a service name and an object and stored it redis
 * @addService
 * @param service {String}
 * @param serviceObject {Object}
 */
function addService(service, serviceObject){

    client.get('uServices', function(err, reply) {
        if (reply == null){
            //extend this object
            //add a key with service name and value service channel
            //this is the first service i should activate it
            var newObjectToPush = JSON.parse('{"' + service + '": []}');//found a fancy way to make this
            serviceObject.status = 1;
            newObjectToPush[service].push(serviceObject);

            uServices = unicorn.xtend(uServices, newObjectToPush);
            setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')

        } else {
            uServices = JSON.parse(reply);
            if (typeof(uServices[service]) !== 'undefined') {

                var uService = uServices[service];
                uService.push(serviceObject);
                //save the new uServices
                uServices[service] = uService;

                setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')

            } else {
                //extend this object
                //add a key with service name and value service channel
                var stringObject = '{"' + service + '": []}'; //found a fancy way to make this
                var objectToPush = JSON.parse(stringObject);
                objectToPush[service].push(serviceObject);
                uServices = unicorn.xtend(uServices,objectToPush);
                setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')
            }
        }
    });
}

/**
 * Set a variable on redis
 * @param variableName
 * @param object
 * @param channel
 * @param option
 */
function setAndPublish(variableName, object, channel, option){

    client.set(variableName, JSON.stringify(object));
    // Publish that it did an update
    client.publish(channel, option);
}

function messageHandler (client2) {

    client2.brpop('uBrokerMessages', 0, function (err, message) {
        try {
            var msg = JSON.parse(message[1]);

            if (msg.respondChannel === '') {
                //assign channel
                var assignedChannel = msg.serviceID + '_' + msg.msgpid;

                msg.ack = 1;
                msg.respondChannel = assignedChannel;
                addService(msg.serviceID, {
                    "channel": assignedChannel,
                    "status": 0,
                    "timestamp": (new Date()).getTime()
                }); //TODO a service always start deactivated
                client.publish('uBrokerInitChannel', JSON.stringify(msg)); // Sending a message
            } else {
                // look for the service and forward the message
                // check in list of service
                // send the message to the service
                // send the message to the brokerChannel as ack=1
                if (msg.request.service !== '' && msg.request.function !== '') {

                    var serviceAssgined = selectService(msg.request.service);

                    if (typeof(serviceAssgined) == 'string') {
                        msg.ack = 1;
                        msg.error.code = 2; //for example this should be defined somewhere
                        msg.error.message = serviceAssgined; //for example this should be defined somewhere
                        client.publish(msg.respondChannel, JSON.stringify(msg));
                    } else {
                        msg.trackingChain.push({
                            "service": serviceAssgined.channel,
                            "timestamp": (new Date()).getTime()
                        });
                        msg.ack = 1;
                        client.publish(serviceAssgined.channel, JSON.stringify(msg));
                    }
                } else {
                    msg.ack = 1;
                    console.log('Request: service and function are not set');
                    msg.error.code = 1; //for example this should be defined somewhere
                    msg.error.message = 'Request: service and function are not set'; //for example this should be defined somewhere
                    client.publish(msg.respondChannel, JSON.stringify(msg));
                }
            }
        } catch (e) {
            console.log(e);
            console.log('There is not more messages...');
        }
    });
}