/*************************************************
 File:      spawn.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var configFile = process.argv[2],
    serviceName = process.argv[3],
    config = require(configFile),
    unicorn = require('./unicorn.js').service(config),
    uThread = require('./lib/uThread.js')(unicorn),
    service = {};

unicorn.path = __dirname;

unicorn.on('ready', function () {
    // Require uTalk and don't continue untill we have all communication setup
    unicorn.uTalk = require('./lib/uTalk.js')(unicorn).then(function(uTalk){


        unicorn.uAlive = require('./lib/uAlive.js')(unicorn);
        // If we are not a thread but a process, send message via stdout to notify uSpawn that the init is done
        if(!process.send) console.log('INITDONE');

        unicorn.uTalk = uTalk;
        console.log('Service ready');
        service = require(require.resolve('./core-services/' + serviceName + '/index.js'))(unicorn);
        uThread.start(serviceName);
        readyFunctions.map(function(func){
            func();
        });
    });
    // Listen to the spawnAreready channel, and on ready get out of maintenance and start listening and stuff

    // We need require magic here and require serviceName

});
