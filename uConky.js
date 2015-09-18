/*************************************************
 File:      redisView.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/



var config = require('./config.json'),
    redis = require('redis');

var client = redis.createClient(config.redis[0].port, config.redis[0].host);

client.on("connect", function () {
    setInterval(function(){
        printStats();
    }, 2000);
});

function printStats() {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    console.log('uniConky - Status and stuff');

    client.multi().info().exec(function (err, replies) {
        var serverInfo = replies[0].split("\n");
        var objInfo = {};
        for (var i = 0; i < serverInfo.length; i++) {
            if(serverInfo[i].trim() !== '' && serverInfo[i].trim().charAt(0) !== '#') {
                var tmpArr = serverInfo[i].trim().split(':');
                objInfo[tmpArr[0]] = tmpArr[1];
            }
        }
        console.log('version: ' + objInfo['redis_version'] + '  -  mode: ' + objInfo['redis_mode']);
        console.log('OPS-SEC: ' + objInfo['instantaneous_ops_per_sec'] + '  -  Connections: ' + objInfo['connected_clients']);
        console.log('Used mem: ' + objInfo['used_memory_human'] + '  -  Peak mem: ' + objInfo['used_memory_peak_human']);
        console.log('======== SERVICES ========');

        client.get('uServices', function(err, result) {
            var services = JSON.parse(result);

            for (var key in services) {
                console.log(key + ': ' + services[key].length);
            }
        });
    });
}

printStats();