// browser-logic.js
// Builds framework for a manual override

// Define variables for speed control
var desiredSpeed = {forward:0, backward:0, left:0, right:0, up:0, down:0, clockwise:0, counterClockwise:0};
var desiredSpeedPropertyNames = Object.getOwnPropertyNames(desiredSpeed);
var lastDesiredSpeed = {};
// Increase desired speed according to the following cubic beizers
var horizontalBezier = bezier(0, 0, 0.25, 0);
var verticalBezier = bezier(0, 0, 0.25, 0);
var rotationalBezier = bezier(0, 0, 0.25, 0);
var speedFunction = {xAxis: horizontalBezier, yAxis: horizontalBezier, zAxis: verticalBezier, yawAxis: rotationalBezier};
// The period of time after which the desired speed shall be maximum
var timetoFullSpeed = {xAxis: 10000, yAxis: 10000, zAxis: 10000, yawAxis: 10000}; // in miliseconds
// The last time a speed command was sent
var lastTimeSpeedSent = -Infinity;

// Define variables for state control (such as `landing` or `takeoff`)
var desiredState = {};
var lastSentDesiredState;
var desireedStatePropertyNames;
resetStateCommand();

var timeBetweenCommands = 100; // in miliseconds
var startingTimeObject = {};

function resetStateCommand () {
    desiredState     = {stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
    desireedStatePropertyNames = Object.getOwnPropertyNames(desiredState);
    lastSentDesiredState = copy(desiredState);
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
        {action: "stop",                key: ['x', 'X']},
        {action: "takeoff",             key: ['t', 'T']},
        {action: "land",                key: ['r', 'R']},
        {action: "disableEmergency",    key: ['g', 'G']},
        {action: "enableEmergency",     key: ['v', 'V']},
        {action: "switchChannel",       key: ['c', 'C']}
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
            var ratioToFullSpeed = within(deltaT / timetoFullSpeed[individualKeyMap.axis], 0, 1);
            console.log(ratioToFullSpeed);
            desiredSpeed[individualKeyMap.direction] = speedFunction[individualKeyMap.axis](ratioToFullSpeed);
            pushCommands();
            // Update startingTime
            startingTimeObject[individualKeyMap.direction] = startingTime;
            return false;
        }, function (keyboardEvent) {
            desiredSpeed[individualKeyMap.direction] = 0;
            pushCommands();
            // Remove starting time
            startingTimeObject[individualKeyMap.direction] = undefined;
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
    var presentTime = new Date().valueOf();
    var isDifferent;
    
    // Determine whether to send speed commands
    isDifferent = desiredSpeedPropertyNames.some(function (propertyName) {
        return this.currentValue[propertyName] != this.lastValue[propertyName];
    }, {currentValue: desiredSpeed, lastValue: lastDesiredSpeed});
    
    if (isDifferent && presentTime - lastTimeSpeedSent >= timeBetweenCommands) {
        // Send commands
        socket.emit('manual-speed', desiredSpeed);
        lastDesiredSpeed = copy(desiredSpeed);
        lastTimeSpeedSent = presentTime;
    }
    
    // Determine whether to send state commands
    isDifferent = desireedStatePropertyNames.some(function (propertyName) {
        return this.currentValue[propertyName] != this.lastValue[propertyName];
    }, {currentValue: desiredState, lastValue: lastSentDesiredState});
    
    if (isDifferent) {
        // Send commands
        desiredState._id = presentTime;
        socket.emit('manual-state', desiredState);
        resetStateCommand(); //lastStateCommand = stateCommand;
    }
}
setInterval(pushCommands, 100);

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
function within (x, min, max) {
    x = Math.max(min, x);
    x = Math.min(max, x);
    return x;
}
function copy (objectToCopy) {
    return JSON.parse(JSON.stringify(objectToCopy));
}
startManualOverride();
