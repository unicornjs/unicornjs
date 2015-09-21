/*************************************************
 File:      uTalk.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

/* Required packages */
var redis = {},
/* Required private modules */
    config = {},
    msgModule = {},
    unicorn = {};

var publishClient = {};


/*Master Logic*/
module.exports = function(unicornInject, noPromise) {
    unicorn = unicornInject;
    config = unicorn.config.get();
    redis = unicorn.redis;
    msgModule = unicorn.uMessage;

    var service = {
        init: function(service, pid){

            return new unicorn.promise(function (resolve, reject) {

                var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server);

                publishClient = redis.createClient(config.redis[0].port, config.redis[0].server);

                // Catch redis errors
                listenClient.on('error', function (error) {
                    console.log('listenClient error: %s', error)
                });

                // Catch redis message
                listenClient.on("message", function (channel, message) {

                    var msg;
                    try {
                        msg = JSON.parse(message);
                        msg = msgModule.verify(msg); // validation of the message

                        if (msg.ack === 1 && msg.serviceID == service) { // a channel have been assign
                            // Catch redis errors
                            listenClient.unsubscribe('uBrokerInitChannel');
                            resolve(msg.respondChannel);
                            //callback or logic mthread
                        }

                    } catch (e){
                        console.log("Message is not a valid json")
                    }

                });

                listenClient.subscribe('uBrokerInitChannel');
                var msg = msgModule.create(service, pid);

                //TODO
                publishClient.rpush('uBrokerMessages', JSON.stringify(msg));
                publishClient.publish('uBroker', JSON.stringify(msg));

            })

        },
        listen : function(channel, callback){

            var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server);

            listenClient.on('error', function (error) {
                console.log('listenClient error: %s', error)
            });
            // Catch redis message
            listenClient.on("message", function (channel, message) {
                var msg;

                try {
                    msg = JSON.parse(message);

                    msg = msgModule.verify(msg); // validation of the message

                    if (msg.ack == 1 && msg.type == 'NORMAL') {
                        callback(msg);
                    } else if ( msg.ack == 0 && msg.type == 'SERVICE') {
                        callback(msg);
                    }

                } catch (e) {
                    console.log("Message is not a valid json")
                }
            });

            listenClient.subscribe(channel);

        },
        sendAnswer : function (message, data) {

            var answer = {"value" : data};
            var msg = msgModule.setData(message, answer);

            publishClient.publish(msg.respondChannel, JSON.stringify(msg));

        },
        sendMessage : function (service, pid, data, request, callback){

            var count = 0;
            config = unicorn.config.get();
            // Here is another wait loop, this is because otherwise we will be too early doing stuff
            var configInterval = setInterval(function(){
                if(Object.keys(config).length !== 0 && Object.keys(unicorn).length !== 0) {

                    clearInterval(configInterval);
                    var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server),
                        publishClient = redis.createClient(config.redis[0].port, config.redis[0].server);

                    var msgID;
                    var msg = msgModule.create(service, pid);
                    msgID =msg.msgID;
                    var privateChannel = service+'_'+pid+'_'+msgID+'_PrivateChannel_'+config.server.name+'_'+config.server.address;
                    msg = msgModule.setData(msg, data);
                    msg = msgModule.setRequest(msg, request);
                    msg.respondChannel = privateChannel;

                    listenClient.on('error', function (error) {
                        listenClient.quit();
                        publishClient.quit();
                        console.log('listenClient error: %s', error)
                    });

                    // Catch redis message
                    listenClient.on("message", function (channel, message) {
                        var msg;
                        try {
                            msg = JSON.parse(message);
                            msg = msgModule.verify(msg); // validation of the message

                            count++;
                            if ( msg.ack == 1 && msg.msgID == msgID) { // just the msg i send
                                //TODO SEND ACK TO THE TRACK CHAIN
                                // unsubscribe of this channel
                                listenClient.quit();
                                publishClient.quit();
                                //console.log(privateChannel)
                                callback(msg.data);
                            }

                        } catch (e) {
                            listenClient.quit();
                            publishClient.quit();
                            console.log("Message is not a valid json")
                        }
                    });

                    listenClient.subscribe(privateChannel);
                    //TODO set in the queue
                    publishClient.rpush('uBrokerMessages', JSON.stringify(msg));
                    //if (msg.type === 'SERVICE'){
                    publishClient.publish('uBroker', JSON.stringify(msg));
                    //}
                    //publishClient.publish('uBroker', JSON.stringify(msg));

                }
            }, 50);
        },
        sendServiceMessage : function (msg){

            publishClient.publish(msg.respondChannel, JSON.stringify(msg));

        }
    };

    if(typeof(noPromise) !== 'undefined' && noPromise == true) {
        return service
    } else {
        return new unicorn.promise(function(resolve, reject){
            resolve(service);
        });
    }
}