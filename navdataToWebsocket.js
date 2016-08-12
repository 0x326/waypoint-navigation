// John Meyer
// August 5
// Navdata to websocket

const WaypointNavigator = require("./");
var io = require('socket.io')(3000);
var waypointNavigation = new WaypointNavigator();

console.log("Websocket listening on port 3000");
waypointNavigation.mission().client().on('navdata', function (data) {
    io.emit('navdata', data);
});
