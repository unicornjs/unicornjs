/*************************************************
 File:      uServiceBalancer.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/

/*
 Do round robin balancing
 */
exports.roundRobin = function(){

    // TODO: Load config from redis, so we can use it in our service
    var config = {};

    var system = {
        start:function(){
            // Code here
        }
    }

    return system;
}

/*
 Do random balancing
 */
exports.random = function(){

    // TODO: Load config from redis, so we can use it in our service
    var config = {};

    var system = {
        start:function(){
            // Code here
        }
    }

    return system;
}

/*
 Balance to the service that has the least load at that moment
 */
exports.loadAware = function(){

    // TODO: Load config from redis, so we can use it in our service
    var config = {};

    var system = {
        start:function(){
            // Code here
        }
    }

    return system;
}