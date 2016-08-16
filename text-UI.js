// waypoint-navigation/text-UI.js
// July 26, 2016
// John Meyer
// This code serves a text-based UI for the waypoint-navigation module

//// Create User Interface ////
// Setup UI
const WaypointNavigator = require("./");
const repl = require('repl');
const ordinal = require("ordinal");
const chalk = require("chalk");

var waypointNavigation = new WaypointNavigator();
var isBottomCameraActivated = false;
// Sometimes REPL will be temporarily closed for the manual override
// This is to distinguish whether the process should close when the REPL closes
// and when the REPL closes to allow the manual piloting
var shouldEndProgram = true;

// Only setup a server if this is the root module
var canSetupServer = require.main === module;
if (canSetupServer) {
    // Setup server for forwarding navdata
    var express = require('express');
    var app = express();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);
    var serverPort = 3000;
}
function startServer () {
    'use strict';
    if (canSetupServer) {
        server.listen(serverPort);
        console.log("Listening on Port %d", serverPort);
    }
}

// Ask for Waypoints
//TODO: Ask for waypoints (in UI)
function startRepl () {
    'use strict';
    console.log("");
    var replServer = repl.start({prompt: '> ', useColors: true});
    replServer.context.waypointNavigation = waypointNavigation;
    replServer.defineCommand('list', {
        help: 'Lists all waypoints and their coordinates',
        action: function(argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.waypointBuffer.forEach(function (value, index, array) {
                    var prescriptStatement = value.hasPrescript ? "(Prescript) " : "";
                    var postscriptStatement = value.hasPostscript ? "(Postscript) " : "";
                    console.log("Waypoint " + index + ": (" + value.location[0] + ", " + value.location[1]+ ", " + value.location[2] + ")" +
                                " " + chalk.green(prescriptStatement) + chalk.blue(postscriptStatement));
                });
            });
        }
    });
    replServer.defineCommand('add', {
        help: 'Adds a waypoint to the waiting list',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                // Read arguments
                if (args[0] == "loiter") { // is a loiter command
                    if (typeof(args[1]) != "undefined") {
                        try {
                            var time = Number(args[1]);
                            // Convert to miliseconds
                            time *= 1000;
                            waypointNavigation.addLoiterWaypoint(time);
                        }
                        catch (err) {
                            err.message = "The argument for loiter time is not a number. Defaulting to 5 seconds";
                            waypointNavigation.addLoiterWaypoint(5000);
                        }
                    }
                    else {
                        console.log("No loiter time specified. Loitering for 5 seconds");
                        waypointNavigation.addLoiterWaypoint(5000);
                    }
                }
                else {
                    // is a regular waypoint command
                    var obj = interpretCoordinate(args);
                }
                // Create waypoint
                var waypoint = new waypointNavigation.Waypoint(obj.x, obj.y, obj.z, obj.units, obj.prescript, obj.postscript);
                // Add waypoint to buffer
                waypointNavigation.addWaypoint(waypoint);
            });
        }
    });
    replServer.defineCommand('insert', {
        help: 'Inserts a waypoint to the front of the waiting list',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var index = args.shift();
                try { index = Number(index); }
                catch (error) { console.warn("the first argument (the index) is not a number"); return; }
                // Read arguments
                var obj = interpretCoordinate(args);
                // Create waypoint
                var waypoint = new waypointNavigation.Waypoint(obj.x, obj.y, obj.z, obj.units, obj.prescript, obj.postscript);
                // Add waypoint to buffer
                waypointNavigation.insertWaypoint(waypoint);
            });
        }
    });
    replServer.defineCommand('remove', {
        help: 'Removes a waypoint to the waiting list',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                // Read arguments
                args.forEach(function (value, index, array) {
                    if (typeof(value) == "number" && value >= 0) {
                        waypointNavigation.removeWaypoint(value);
                    }
                    else {
                        // Argument cannot represent an index value for the Array waypointBuffer
                        throw new Error("The " + index + ordinal.english.indicator(index) + " argument is not a whole number. All arguments must be whole numbers");
                    }
                });
            });
        }
    });
    replServer.defineCommand('start', {
        help: "Tells the drone to go to the next given waypoint",
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.isAllowedToActivateWaypoints = true;
                waypointNavigation.activateWaypoint();
            });
        }
    });
    replServer.defineCommand('abort', {
        help: 'Tells the drone to stop its current course',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.isAllowedToActivateWaypoints = false;
                waypointNavigation.mission().abort();
            });
        }
    });
    replServer.defineCommand('erase', {
        help: 'Clears all waypoints from the list',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.waypointBuffer = [];
            });
        }
    });
    replServer.defineCommand('takeoff', {
        help: 'Tells the drone to takeoff',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().control().enable();
                waypointNavigation.mission().client().takeoff();
            });
        }
    });
    replServer.defineCommand('land', {
        help: 'Tells the drone to land',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().control().disable();
                waypointNavigation.mission().client().stop();
                waypointNavigation.mission().client().land();
            });
        }
    });
    replServer.defineCommand('battery', {
        help: 'Get the battery level',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                console.log("Battery: " + waypointNavigation.mission().client().battery());
            });
        }
    });
    replServer.defineCommand('ftrim', {
        help: 'Get a flat trim',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().ftrim();
            });
        }
    });
    replServer.defineCommand('disableEmergency', {
        help: 'Disable emergency',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                console.log("This command is not yet implemented");
                //TODO: Add code
            });
        }
    });
    replServer.defineCommand('enableEmergency', {
        help: 'Enable emergency',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                console.log("This command is not yet implemented");
                //TODO: Add code
            });
        }
    });
    /*replServer.defineCommand('changeVideoChannel', {
        help: 'Switch the video feed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                console.log("This command is not yet implemented");
                ;
            });
        }
    });*/
    /*
    ____       _____               __  ___                        __   ______            __             __    
   / __ \___  / __(_)___  ___     /  |/  /___ _____  __  ______ _/ /  / ____/___  ____  / /__________  / /____
  / / / / _ \/ /_/ / __ \/ _ \   / /|_/ / __ `/ __ \/ / / / __ `/ /  / /   / __ \/ __ \/ __/ ___/ __ \/ / ___/
 / /_/ /  __/ __/ / / / /  __/  / /  / / /_/ / / / / /_/ / /_/ / /  / /___/ /_/ / / / / /_/ /  / /_/ / (__  ) 
/_____/\___/_/ /_/_/ /_/\___/  /_/  /_/\__,_/_/ /_/\__,_/\__,_/_/   \____/\____/_/ /_/\__/_/   \____/_/____/  
    */
    replServer.defineCommand('manual-forward', {
        help: 'Manual: Go forward a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
                        // Send error notice to the console but don't throw an error
                        console.error("Forward command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().front(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-backward', {
        help: 'Manual: Go backward a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err) {
                        // Send error notice to the console but don't throw an error
                        console.error("Backward command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().back(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-left', {
        help: 'Manual: Go left a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err) {
                        // Send error notice to the console but don't throw an error
                        console.error("Left command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().left(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-right', {
        help: 'Manual: Go right a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err) {
                        // Send error notice to the console but don't throw an error
                        console.error("Right command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().right(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-clockwise', {
        help: 'Manual: Turn clockwise a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err) {
                        // Send error notice to the console but don't throw an error
                        console.error("Clockwise command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().clockwise(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-counterClockwise', {
        help: 'Manual: Turn counter-clockwise a certain speed',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined") {
                    try {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err) {
                        // Send error notice to the console but don't throw an error
                        console.error("Counter-clockwise command does not have a numerical speed");
                    }
                    waypointNavigation.mission().client().counterClockwise(commandSpeed);
                }
            });
        }
    });
    replServer.defineCommand('manual-stop', {
        help: 'Manual: Stop the drone',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().stop();
            });
        }
    });
    replServer.defineCommand('manual-takeoff', {
        help: 'Manual: Takeoff',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().takeoff();
            });
        }
    });
    replServer.defineCommand('manual-land', {
        help: 'Manual: Land',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().land();
            });
        }
    });
    replServer.defineCommand('manual-flip', {
        help: 'Manual: Perform a flip',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                // The following is modified from https://github.com/eschnou/ardrone-webflight/blob/master/plugins/pilot/public/js/pilot.js
                var direction = null;
                if (typeof(args[0]) == "undefined") {
                    //TODO: Flip in the direction of motion
                    waypointNavigation.mission().client().animate('flipLeft', 1000);
                }
                else if (args[0] == "forward") {
                    waypointNavigation.mission().client().animate('flipAhead', 1000);
                }
                else if (args[0] == "backward") {
                    waypointNavigation.mission().client().animate('flipBehind', 1000);
                }
                else if (args[0] == "left") {
                    waypointNavigation.mission().client().animate('flipLeft', 1000);
                }
                else if (args[0] == "right") {
                    waypointNavigation.mission().client().animate('flipRight', 1000);
                }
                else {
                    // Argument is not recognized
                    // Send error notice to the console but don't throw an error
                    console.error("The flip command's argument (%s) is not recognized", args[0]);
                }
            });
        }
    });
    replServer.defineCommand('manual-calibrate', {
        help: 'Manual: Calibrate',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().calibrate(0);
            });
        }
    });
    /*
        ____       _____               _____                              ______                                          __    
       / __ \___  / __(_)___  ___     / ___/___  ______   _____  _____   / ____/___  ____ ___  ____ ___  ____ _____  ____/ /____
      / / / / _ \/ /_/ / __ \/ _ \    \__ \/ _ \/ ___/ | / / _ \/ ___/  / /   / __ \/ __ `__ \/ __ `__ \/ __ `/ __ \/ __  / ___/
     / /_/ /  __/ __/ / / / /  __/   ___/ /  __/ /   | |/ /  __/ /     / /___/ /_/ / / / / / / / / / / / /_/ / / / / /_/ (__  ) 
    /_____/\___/_/ /_/_/ /_/\___/   /____/\___/_/    |___/\___/_/      \____/\____/_/ /_/ /_/_/ /_/ /_/\__,_/_/ /_/\__,_/____/  
    
    */
    replServer.defineCommand('navdata', {
        help: 'Opens a server to investigate the navdata',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                startServer();
                app.use(express.static('../graphic-object-monitoring/public'));
                waypointNavigation.mission().client().config('general:navdata_demo', false);
                waypointNavigation.mission().client().on('navdata', function (data) {
                    io.emit('navdata', data);
                });
            });
        }
    });
    replServer.defineCommand('manual', {
        help: 'Opens a server for manual override',
        action: function (argv) {
            executeCommand(this, argv, function (args) {
                startServer();
                app.use(express.static('web-UI-public'));
                io.on('connection', function(socket) {
                    // Disable the controller upon connection
                    waypointNavigation.mission().control().disable();
                    // Emit that the manual override is active
                    socket.emit('manual-override', true);
                    socket.on('manual-override', function(isActivated) {
                        try {
                            isActivated = Boolean(isActivated);
                            if (isActivated) {
                                waypointNavigation.mission().control().disable();
                                socket.emit('manual-override', true);
                            }
                            else {
                                waypointNavigation.mission().control().enable();
                                socket.emit('manual-override', false);
                            }
                        }
                        catch (err) {
                            // Do nothing
                        }
                    });
                    socket.on('manual-speed', function (speedCommand) {
                        var client = waypointNavigation.mission().client();
                        var xSpeedCommand, ySpeedCommand, zSpeedCommand, yawSpeedCommand;
                        // Check speeds
                        if (typeof speedCommand != "object") {
                            return;
                        }
                        var propertyNames = ["forward", "backward", "left", "right", "up", "down", "clockwise", "counterClockwise"];
                        propertyNames.forEach(function (propertyName) {
                            if (typeof this[propertyName] != "number") {
                                try {
                                    this[propertyName] = Number(this[propertyName]);
                                }
                                catch (err) {
                                    this[propertyName] = 0;
                                }
                            }
                        }, speedCommand);
                        // Calculate speeds
                        xSpeedCommand = speedCommand.forward - speedCommand.backward;
                        ySpeedCommand = speedCommand.right - speedCommand.left;
                        zSpeedCommand = speedCommand.up - speedCommand.down;
                        yawSpeedCommand = speedCommand.clockwise - speedCommand.counterClockwise;
                        
                        // Command speeds
                        client.front(within(xSpeedCommand));
                        client.right(within(ySpeedCommand));
                        client.up(within(zSpeedCommand));
                        client.clockwise(within(yawSpeedCommand));
                    });
                    socket.on('manual-state', function(stateCommand) {
                        var client = waypointNavigation.mission().client();
                        // Check states
                        if (typeof stateCommand != "object") {
                            return;
                        }
                        if (typeof stateCommand._id != "number") {
                            stateCommand._id = null;
                        }
                        var propertyNames = ["stop", "takeoff", "land", "disableEmergency", "enableEmergency", "flip", "switchChannel"];
                        propertyNames.forEach(function (propertyName) {
                            if (typeof this[propertyName] != "boolean") {
                                try {
                                    this[propertyName] = Boolean(this[propertyName]);
                                }
                                catch (err) {
                                    this[propertyName] = false;
                                }
                            }
                        }, stateCommand);
                        // Command states
                        if (stateCommand.stop) {
                            client.stop();
                        }
                        if (stateCommand.takeoff) {
                            client.takeoff();
                        }
                        if (stateCommand.land) {
                            client.land();
                        }
                        if (stateCommand.disableEmergency) {
                            client.disableEmergency();
                        }
                        if (stateCommand.enableEmergency) {
                            //TODO: Figure out how to do this
                            console.log("Enable-Emergency is ignored");
                        }
                        if (stateCommand.flip) {
                            //TODO: Workout flips
                            console.log("Flip is ignored");
                        }
                        if (stateCommand.switchChannel) {
                            client.config('video:video_channel', Number(isBottomCameraActivated) * 3);
                            isBottomCameraActivated = !isBottomCameraActivated;
                        }
                        socket.emit('manual-state-received', stateCommand._id);
                    });
                    socket.on('disconnect', function () {
                        // Reenable the controller upon a disconnect
                        waypointNavigation.mission().control().enable();
                        // Emit that the manual override is disabled
                        io.emit('manual-override', false);
                    });
                });
            });
        }
    });
    replServer.on('exit', function () {
        console.log("\n" + "Landing drone");
        waypointNavigation.mission().control().disable();
        waypointNavigation.mission().client().stop();
        waypointNavigation.mission().client().land(function () {
            process.exit(0);
        });
    });
}

// Interprets coordinate data from the REPL
// args accepts an array of strings which represent the arguments from the command line
// Returns {x:Number, y:Number, z:Number, units:String, prescript:Function, postscript:Function}
function interpretCoordinate (args) {
    var xCoordinate, yCoordinate, zCoordinate, units, prescript, postscript;
    args.forEach(function (value, index, array) {
        if (value.indexOf("=") != -1) {
            // Argument is a coordinate
            var splitValue = value.split("=");
            var component = splitValue[0].toUpperCase();
            var magnitude = splitValue[1];
            try {
                magnitude = Number(magnitude);
            }
            catch (err) {
                err.message = "Magnitude must represent a number";
                throw err;
            }
            switch (component) {
                case "X":
                    xCoordinate = magnitude;
                    break;
                case "Y":
                    yCoordinate = magnitude;
                    break;
                case "Z":
                    zCoordinate = magnitude;
                    break;
                default:
                    // Component argued does not exist on the X-Y-Z coordinate space
                    // User probably made a typo
                    throw new Error("The " + index + ordinal.english.indicator(index) + " argument is incorrect. Invalid component");
            }
        }
        else if (typeof(global[value]) == "function") {
            // Argument is either presript or postscript
            if (typeof(prescript) == "undefined")
                prescript = global[value];
            else if (typeof(postscript) == "undefined")
                postscript = global[value];
            else if (postscript != global[value])
                throw new Error("The " + index + ordinal.english.indicator(index) + " argument specifies a second postscript when there was one before it");
            else
                console.warn("The " + index + ordinal.english.indicator(index) + "argument is redundant. Ignoring");
        }
        else {
            // Argument is the unit
            units = value;
        }
        //
    });
    return {x: xCoordinate, y:yCoordinate, z:zCoordinate, units:units, prescript:prescript, postscript:postscript};
}
function within(x, min, max) {
    'use strict';
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}

// This function provides a wrapper to do the redundant tasks that must always be done before and after executing the logic of a command
// The `callback` function should accept an Array of Strings
function executeCommand(self, argv, funct) {
    self.lineParser.reset();
    self.bufferedCommand = '';
    // If no arguments exist, create an empty placeholder
    if (typeof(argv) == "undefined") {
        argv = [];
    }
    // Clean arguments
    while (argv.indexOf("  ") != -1) {
        argv = argv.replace(/  /i, ' ');
    }
    // Parse arguments
    var args = argv.split(" ");
    // Send to callback function (the function with the logic specific to a particular command)
    try { funct(args); }
    catch (error) {
        console.error("Error while executing command: " + error.message);
    }
    finally {
        // Display the prompt
        self.displayPrompt();
    }
}

startRepl();
//TODO: Consider using require("image-to-ascii") to show a geographical map
