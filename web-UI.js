// Web-UI for Manual Control
var textInterface = require("./text-UI.js");
var stream = require("stream");
// Only setup a server if this is the root module
var canSetupServer = require.main === module;
if (canSetupServer)
{
    // Setup server for forwarding navdata
    var express = require('express');
    var app = express();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);
    var serverPort = 3000;
}
function startServer ()
{
    if (canSetupServer)
    {
        server.listen(serverPort);
        console.log("Listening on Port %d", serverPort);
    }
}

