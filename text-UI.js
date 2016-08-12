// waypoint-navigation/text-UI.js
// July 26, 2016
// John Meyer
// This code serves a text-based UI for the waypoint-navigation module

'use strict';

//// Create User Interface ////
// Setup UI
const WaypointNavigator = require("./");
const repl = require('repl');
const ordinal = require("ordinal");
const chalk = require("chalk");

var waypointNavigation = new WaypointNavigator();
// Sometimes REPL will be temporarily closed for the manual override
// This is to distinguish whether the process should close when the REPL closes
// and when the REPL closes to allow the manual piloting
var shouldEndProgram = true;

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

// Ask for Waypoints
//TODO: Ask for waypoints (in UI)
function startRepl ()
{
    console.log("");
    var replServer = repl.start({prompt: '> ', useColors: true});
    replServer.context.waypointNavigation = waypointNavigation;
    replServer.defineCommand('list', {
        help: 'Lists all waypoints and their coordinates',
        action: function(argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.waypointBuffer.forEach(function (value, index, array) {
                    var prescriptStatement = value.hasPrescript ? "(Prescript) " : "";
                    var postscriptStatement = value.hasPostscript ? "(Postscript) " : "";
                    console.log("Waypoint " + index + ": (" + value.location[0] + ", " + value.location[1]+ ", " + value.location[2] + ")"
                                + " " + chalk.green(prescriptStatement) + chalk.blue(postscriptStatement));
                });
            });
        }
    });
    replServer.defineCommand('add', {
        help: 'Adds a waypoint to the waiting list',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                // Read arguments
                if (args[0] == "loiter") // is a loiter command
                {
                    if (typeof(args[1]) != "undefined")
                    {
                        try
                        {
                            var time = Number(args[1]);
                            // Convert to miliseconds
                            time *= 1000;
                            waypointNavigation.addLoiterWaypoint(time);
                        }
                        catch (err)
                        {
                            err.message = "The argument for loiter time is not a number. Defaulting to 5 seconds";
                            waypointNavigation.addLoiterWaypoint(5000);
                        }
                    }
                    else
                    {
                        console.log("No loiter time specified. Loitering for 5 seconds");
                        waypointNavigation.addLoiterWaypoint(5000);
                    }
                }
                else // is a regular waypoint command
                    var obj = interpretCoordinate(args);
                // Create waypoint
                var waypoint = new waypointNavigation.Waypoint(obj.x, obj.y, obj.z, obj.units, obj.prescript, obj.postscript);
                // Add waypoint to buffer
                waypointNavigation.addWaypoint(waypoint);
            });
        }
    });
    replServer.defineCommand('insert', {
        help: 'Inserts a waypoint to the front of the waiting list',
        action: function (argv)
        {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                // Read arguments
                args.forEach(function (value, index, array) {
                    if (typeof(value) == "number" && value >= 0)
                        waypointNavigation.removeWaypoint(value);
                    else
                        // Argument cannot represent an index value for the Array waypointBuffer
                        throw new Error("The " + index + ordinal.english.indicator(index) + " argument is not a whole number. All arguments must be whole numbers");
                });
            });
        }
    });
    replServer.defineCommand('start', {
        help: "Tells the drone to go to the next given waypoint",
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.isAllowedToActivateWaypoints = true;
                waypointNavigation.activateWaypoint();
            });
        }
    });
    replServer.defineCommand('abort', {
        help: 'Tells the drone to stop its current course',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.isAllowedToActivateWaypoints = false;
                waypointNavigation.mission().abort();
            });
        }
    });
    replServer.defineCommand('erase', {
        help: 'Clears all waypoints from the list',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.waypointBuffer = [];
            });
        }
    });
    replServer.defineCommand('takeoff', {
        help: 'Tells the drone to takeoff',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().control().enable();
                waypointNavigation.mission().client().takeoff();
            });
        }
    });
    replServer.defineCommand('land', {
        help: 'Tells the drone to land',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().control().disable();
                waypointNavigation.mission().client().stop();
                waypointNavigation.mission().client().land();
            });
        }
    });
    replServer.defineCommand('battery', {
        help: 'Get the battery level',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                console.log("Battery: " + waypointNavigation.mission().client().battery());
            });
        }
    });
    replServer.defineCommand('ftrim', {
        help: 'Get a flat trim',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().ftrim();
            });
        }
    });
    replServer.defineCommand('disableEmergency', {
        help: 'Activate manual override',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                ;
            });
        }
    });
    replServer.defineCommand('enableEmergency', {
        help: 'Activate manual override',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                ;
            });
        }
    });
    /*replServer.defineCommand('changeVideoChannel', {
        help: 'Activate manual override',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var commandSpeed = 0;
                if (typeof(args[0]) != "undefined")
                {
                    try
                    {
                        commandSpeed = Number(args[0]);
                    }
                    catch (err)
                    {
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
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().stop();
            });
        }
    });
    replServer.defineCommand('manual-takeoff', {
        help: 'Manual: Takeoff',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().takeoff();
            });
        }
    });
    replServer.defineCommand('manual-land', {
        help: 'Manual: Land',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                waypointNavigation.mission().client().land();
            });
        }
    });
    replServer.defineCommand('manual-flip', {
        help: 'Manual: Perform a flip',
        action: function (argv)
        {
            executeCommand(this, argv, function (args) {
                var direction = null;
                if (typeof(args[0]) == "undefined")
                {
                    //TODO: Flip in the direction of motion
                    client.animate('flipLeft', 1000);
                }
                else if (args[0] == "forward")
                    client.animate('flipAhead', 1000);
                else if (args[0] == "backward")
                    client.animate('flipBehind', 1000);
                else if (args[0] == "left")
                    client.animate('flipLeft', 1000);
                else if (args[0] == "right")
                    client.animate('flipRight', 1000);
                else
                {
                    // Argument is not recognized
                    // Send error notice to the console but don't throw an error
                    console.error("The flip command's argument (%s) is not recognized", args[0]);
                }
            });
        }
    });
    replServer.defineCommand('manual-calibrate', {
        help: 'Manual: Calibrate',
        action: function (argv)
        {
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
        action: function (argv)
        {
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
function interpretCoordinate (args)
{
    var xCoordinate, yCoordinate, zCoordinate, units, prescript, postscript;
    args.forEach(function (value, index, array) {
        if (value.indexOf("=") != -1)
        {
            // Argument is a coordinate
            var splitValue = value.split("=");
            var component = splitValue[0].toUpperCase();
            var magnitude = splitValue[1];
            try
            {
                magnitude = Number(magnitude);
            }
            catch (err)
            {
                err.message = "Magnitude must represent a number";
                throw err;
            }
            switch (component)
            {
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
        else if (typeof(global[value]) == "function")
        {
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
        else
        {
            // Argument is the unit
            units = value;
        }
        //
    });
    return {x: xCoordinate, y:yCoordinate, z:zCoordinate, units:units, prescript:prescript, postscript:postscript};
}
const KEY_CODE_MAP =  {"0":"96","1":"97","2":"98","3":"99","4":"100","5":"101","6":"102","7":"103","8":"104","9":"105","backspace":"8","tab":"9","return":"13","shift":"16","ctrl":"17","alt":"18","pausebreak":"19","capslock":"20","escape":"27"," ":"32","pageup":"33","pagedown":"34","end":"35","home":"36","left":"37","up":"38","right":"39","down":"40","+":"107","printscreen":"44","insert":"45","delete":"46",";":"186","=":"187","a":"65","b":"66","c":"67","d":"68","e":"69","f":"70","g":"71","h":"72","i":"73","j":"74","k":"75","l":"76","m":"77","n":"78","o":"79","p":"80","q":"81","r":"82","s":"83","t":"84","u":"85","v":"86","w":"87","x":"88","y":"89","z":"90","*":"106","-":"189",".":"190","/":"191","f1":"112","f2":"113","f3":"114","f4":"115","f5":"116","f6":"117","f7":"118","f8":"119","f9":"120","f10":"121","f11":"122","f12":"123","numlock":"144","scrolllock":"145",",":"188","`":"192","[":"219","\\":"220","]":"221","'":"222"};
function startManualOverride ()
{
    // Setup Key Map for One-handed controls
    var forward  = 'w'
      , backward = 's'
      , left     = 'a'
      , right    = 'd'
      , clockwise = 'e'
      , counterClockwise = 'q'
      , stop = 'x'
      , takeoff = 't'
      , land = 'r'
      , disableEmergency = 'g'
      , enableEmergency = 'v'
      , flip     = 'f'
      , channel  = 'c'
      ;
    var keyMap = {};
    keyMap[KEY_CODE_MAP[forward]] = {command:'move-forward'};
    keyMap[KEY_CODE_MAP[backward]] = {command:'move-backward'};
    keyMap[KEY_CODE_MAP[left]] = {command:'move-left'};
    keyMap[KEY_CODE_MAP[right]] = {command:'move-right'};
    keyMap[KEY_CODE_MAP[clockwise]] = {command:'move-clockwise'};
    keyMap[KEY_CODE_MAP[counterClockwise]] = {command:'move-counterClockwise'};
    keyMap[KEY_CODE_MAP[flip]] = {command:'flip-flip'};
    keyMap[KEY_CODE_MAP[channel]] = {command:'channel-change'};
    // Disable controller
    waypointNavigation.mission().control().disable();
    // Bind keyboard listeners
    keyboardJS.bind(KEY_CODE_MAP[forward], function (e) {
        console.log(e);
    });
}
// This function provides a wrapper to do the redundant tasks that must always be done before and after executing the logic of a command
// The `callback` function should accept an Array of Strings
function executeCommand(self, argv, funct)
{
    self.lineParser.reset();
    self.bufferedCommand = '';
    // If no arguments exist, create an empty placeholder
    if (typeof(argv) == "undefined")
        argv = [];
    // Clean arguments
    while (argv.indexOf("  ") != -1)
        argv = argv.replace(/  /i, ' ');
    // Parse arguments
    var args = argv.split(" ");
    // Send to callback function (the function with the logic specific to a particular command)
    try { funct(args); }
    catch (error)
    {
        console.error("Error while executing command: " + error.message);
    }
    finally
    {
        // Display the prompt
        self.displayPrompt();
    }
}

startRepl();
//TODO: Consider using require("image-to-ascii") to show a geographical map
