// browser-logic.js
// Builds framework for a manual override

// Define/Declare variables
var desiredSpeed = {forward:0, backward:0, left:0, right:0, up:0, down:0, clockwise:0, counterClockwise:0};
var horizontalBezier = bezier(0, 0, 1, 0.5);
var verticalBezier = bezier(0, 0, 1, 0.5);
var rotationalBezier = bezier(0, 0, 1, 0.5);
var speedFunction = {xAxis: horizontalBezier, yAxis: horizontalBezier, zAxis: verticalBezier, yawAxis: rotationalBezier};
var timetoFullSpeed = {xAxis: 3, yAxis: 3, zAxis: 3, yawAxis: 3};
var lastTimeSpeedCommandSent = -1;
var desiredState = {};
var desireedStatePropertyNames;
var lastSentDesiredState;
var timeBetweenCommands = 100; // in miliseconds
var startingTimeObject = {};

function resetStateCommand () {
    desiredState     = {stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
    lastSentDesiredState = {stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
    desireedStatePropertyNames =["stop", "takeoff", "land", "disableEmergency", "enableEmergency", "flip", "switchChannel"];
}

function startManualOverride () {
    'use strict';
    // Setup Key Map for One-handed controls
    var directionalKeyMap = [
        {axis: "xAxis",   direction: "forward",             key: ['w', 'W']},
        {axis: "xAxis",   direction: "backward",            key: ['s', 'S']},
        {axis: "yAxis",   direction: "left",                key: ['a', 'A']},
        {axis: "yAxis",   direction: "right",               key: ['d', 'D']},
        {axis: "zAxis",   direction: "up",                  key: 'spacebar'},
        {axis: "zAxis",   direction: "down",                key: 'shift + spacebar'},
        {axis: "yawAxis", direction: "clockwise",           key: ['e', 'E']},
        {axis: "yawAxis", direction: "counterClockwise",    key: ['q', 'Q']}
    ];
    var stateKeyMap = [
        {action: "stop", key: ['x', 'X']},
        {action: "takeoff", key: ['t', 'T']},
        {action: "land", key: ['r', 'R']},
        {action: "disableEmergency", key: ['g', 'G']},
        {action: "enableEmergency", key: ['v', 'V']},
        {action: "switchChannel", key:['c', 'C']}
    ];
    var flipKey = ['f', 'F'];
    
    resetStateCommand();
    // Bind keyboard listeners
    directionalKeyMap.forEach(function(individualKeyMap) {
        keyboardJS.bind(individualKeyMap.key, function (keyboardEvent) {
            var presentTime = new Date();
            var startingTime = startingTimeObject[individualKeyMap.direction];
            if (typeof startingTime == "undefined") {
                startingTime = presentTime;
            }
            var deltaT = presentTime - startingTime;
            
            desiredSpeed[individualKeyMap.direction] = speedFunction[individualKeyMap.axis](deltaT / timetoFullSpeed[individualKeyMap.axis]);
            pushCommands();
            return false;
        }, function (keyboardEvent) {
            desiredSpeed[individualKeyMap.direction] = 0;
            pushCommands();
            return false;
        });
    });
    stateKeyMap.forEach(function (individualStateKeyMap) {
        keyboardJS.bind(individualStateKeyMap.key, function (keyboardEvent) {
            desiredState[individualStateKeyMap.action] = true;
            pushCommands();
            return false;
        }, function (keyboardEvent) {
            return false;
        });
    });
    keyboardJS.bind(flipKey, function (keyboardEvent) {
        //TODO: Determine which direction to flip
        desiredState.flip;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
}

function pushCommands () {
    'use strict';
    var presentTime = new Date();
    if (typeof lastTimeSpeedCommandSent == "undefined" || presentTime.valueOf() - lastTimeSpeedCommandSent.valueOf() >= timeBetweenCommands) {
        // Send commands
        socket.emit('manual-speed', desiredSpeed);
        
        lastTimeSpeedCommandSent = presentTime;
    }
    
    var isDifferent = desireedStatePropertyNames.some(function (propertyName) {
        return this.currentValue[propertyName] != this.lastValue[propertyName];
    }, {currentValue: desiredState, lastValue: lastSentDesiredState});
    
    if (isDifferent) {
        // Send commands
        desiredState._id = presentTime.valueOf();
        socket.emit('manual-state', desiredState);
        
        resetStateCommand(); //lastStateCommand = stateCommand;
    }
}
/*socket.on('manual-state-received', function (id) {
    try {
        id = Number(id);
        if (id === lastStateCommand._id) {
            resetStateCommand();
        }
    }
    catch (err) {
        // Do nothing
    }
});*/

startManualOverride();
