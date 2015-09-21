/*************************************************
 File:      uConfig.js
 Project:   uConfig
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/


module.exports = function(unicorn) {
    // Reminder redis is in unicorn.redis

    var client = {},
        uConfig = {},
        listenClient = {},
        Path = require('path');

    var defaultConfig = require(Path.join(unicorn.path, './defaultConfig.json'));

    function mergeOrSetConfig(client, config) {
        return new unicorn.promise(function (resolve, reject) {
            client.get('uConfig', function(err, reply) {
                if(err) {
                    // Do something to handle the error here proper
                    console.log(err);
                    reject(err);
                }
                // See if there is config in redis already
                if(reply !== null) {
                    // If there is config merge is with the config, but give redis precedence
                    uConfig = unicorn.xtend(config, JSON.parse(reply));
                    resolve(client.set('uConfig', JSON.stringify(uConfig)));
                } else {
                    // There is no config in redis, use the config object
                    uConfig = unicorn.xtend(defaultConfig, config);
                    // Write this config to redis
                    resolve(client.set('uConfig', JSON.stringify(uConfig)));
                }
            });
        })
    }

    var config = {
        init:function(config) {
            return new unicorn.promise(function (resolve, reject) {
                client = unicorn.redis.createClient(config.redis[0].port, config.redis[0].host);
                listenClient = unicorn.redis.createClient(config.redis[0].port, config.redis[0].server, {});

                client.on('connect', function() {
                    mergeOrSetConfig(client, config).then(function (done) {
                        resolve(done)
                    }, function (err) {
                        listenClient.quit();
                        client.quit();
                        reject(err)
                    });
                });

                listenClient.on('message', function(channel, message) {
                    client.get('uConfig', function(err, reply) {
                        listenClient.quit();
                        client.quit();
                        uConfig = JSON.parse(reply);
                    });
                });

                listenClient.on("error", function (err) {
                    console.log("Redis listen error " + err);
                });

                listenClient.subscribe('uConfigChannel');
            })
        },
        get:function(){
            return uConfig;
        },
        getPromise:function(){
            return new unicorn.promise(function (resolve, reject) {
                var configInterval = setInterval(function(){
                    if(Object.keys(uConfig).length !== 0) {
                        clearInterval(configInterval);
                        resolve(uConfig);
                    }
                }, 50);
            });
        },
        set:function(config){
            uConfig = unicorn.xtend(uConfig, config)
            client.set('uConfig', JSON.stringify(uConfig));

            // Publish that we did an update
            client.publish('uConfigChannel', 'UPDATE');
            return uConfig;
        },
        reset:function() {
            client.set('uConfig', "{}");
        },
        release:function(){
            // Release the config channel
            console.log('Config channels released');
            client.quit();
            listenClient.quit();
        }
    };

    return config;
}