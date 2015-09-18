/*************************************************
 File:      index.js
 Project:   unicornJS
 For:       UnicornJS (2015)
 By:        Lars van der Schans (◣_◢)
 ::: (\_(\  Daniela Ruiz (｡◕‿◕｡)
 *: (=’ :’) :*
 •..(,(”)(”)¤°.¸¸.•´¯`»***************************/


var config = require('./config.json'),
    unicorn = require('./unicorn.js').system(config);


unicorn.on('ready', function () {
    unicorn.start();
});
