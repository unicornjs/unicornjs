/*************************************************
 File:      uniTest.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/


/*
 TODO: Crashes after 1200 messages
 i=0;while true; do node uniTest.js;echo $i;i=$[i+8]; done
 */

var config = require('./config.json'),
    unicorn = require('./unicorn.js').client(config);

unicorn.on('ready', function () {
    console.log('Ready here');

    // Somehow messages come back twice, this might have to do with an old version of the broker.
    // Bit odd, if this still happens with the new broker, we might look at this closer
    // When you send them async at the same time, answer is there twice, if you send them in sequence all happens correct

    // Send a test message to the system and see if we get an answer
    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer A: %j', answer);
        //here you the message
    });

    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer B: %j', answer);
        //here you the message
    });

    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer C: %j', answer);
        //here you the message
    });


    // Send a test message to the system and see if we get an answer
    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": 13}, {
        "service": "uMath",
        "function": "divide"
    }, function (answer) {
        console.log('Answer D: %j', answer);
        //here you the message
    });

    /////////////////////////////

    // Send a test message to the system and see if we get an answer
    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer E: %j', answer);
        //here you the message
    });

    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer F: %j', answer);
        //here you the message
    });

    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": Math.round(10 * Math.random())}, {
        "service": "uMath",
        "function": "multiply"
    }, function (answer) {
        console.log('Answer G: %j', answer);
        //here you the message
    });


    // Send a test message to the system and see if we get an answer
    unicorn.uTalk.sendMessage('uniTest', process.pid, {"input": 13}, {
        "service": "uMath",
        "function": "divide"
    }, function (answer) {
        console.log('Answer H: %j', answer);
        //here you the message
    });

});



/*
 LOL Daniel, the one thing left here to do for the client.. Is release the redis channel when the answer is there.
 Now the process hangs, because it is on redis channel
 */
