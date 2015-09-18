/*************************************************
 File:      index.js
 Project:   uThread
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

var unicorn = {},
    config = {},
    thread = {},
    uThread = {},
    cluster = require('cluster');

// Define some variables because the system is too fast and all objects will be empty otherwise
//unicorn.uTalk = {};

module.exports = function(unicornInject) {
    unicorn = unicornInject;

    unicorn.ipcMessage = function(type, data){
        return {
            type:type,
            data:data,
            error:''
        }
    }

    unicorn.config.getPromise().then(function(uConfig){
        config = uConfig;
    });

    uThread = {
        start:function(serviceName){
            if (cluster.isMaster) {
                // We are the master thread
                // Wait for the config to load
                var configInterval = setInterval(function(){
                    if(Object.keys(config).length !== 0 && Object.keys(unicorn).length !== 0) {
                        clearInterval(configInterval);
                        thread = require(unicorn.path + '/lib/uThreadMaster.js')(serviceName, unicorn, cluster, config);
                    }
                }, 50);
            } else {
                // We are the worker thread
                var configInterval = setInterval(function(){
                    if(Object.keys(config).length !== 0 && Object.keys(unicorn).length !== 0) {
                        clearInterval(configInterval);
                        thread = require(unicorn.path + '/lib/uThreadWorker.js')(serviceName, unicorn, cluster, config);
                    }
                }, 50);
            }
        }
    };

    return uThread;
};