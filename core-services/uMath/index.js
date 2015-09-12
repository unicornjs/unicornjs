/*************************************************
 File:      index.js
 Project:   uMath
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var unicorn = {};

module.exports = function(unicornInject) {
    unicorn = unicornInject;

    unicorn.on('message', function(message, respond){
        /*
         This function is executed when the service receives a message from a client.
         You should manipulate the data in the message, and respond with a message
         */
        console.log('uMath message for PID:' + process.pid);
        var ans = message.data.input * 3;
        message.data = {answer:ans};
        respond(message);
    },'multiply');

    unicorn.on('message', function(message, respond){
        /*
         This function is executed when the service receives a message from a client.
         You should manipulate the data in the message, and respond with a message
         */
        console.log('uMath message for PID:' + process.pid);
        var ans = message.data.input / 3;
        message.data = {answer:ans};
        respond(message);
    },'divide');

    unicorn.on('active', function(){
        /*
         This function is executed when the service receives the service command active.
         You should write the logic to active your service here
         */

        console.log('Math is active now');
    });

    unicorn.on('ready', function(){
        /*
         This function is executed when the service receives the service command active.
         You should write the logic to active your service here
         */

        console.log('Math is ready now');
    });

    unicorn.on('threadReady', function(){
        /*
         This function is executed when the service receives the service command active.
         You should write the logic to active your service here
         */

        console.log('Math thread is ready now');
    });

    unicorn.on('masterReady', function(){
        /*
         This function is executed when the service receives the service command active.
         You should write the logic to active your service here
         */

        console.log('Math master is ready now');
    });
}