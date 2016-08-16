// browser-logic.js
// Builds framework for a manual override

// Define/Declare variables
var speedCommand = {forward:0, backward:0, left:0, right:0, up:0, down:0, clockwise:0, counterClockwise:0};
var speedIncrement = {xAxis: 0.01, yAxis: 0.01, zAxis: 0.01, yawAxis: 0.1};
var lastTimeSpeedSent = -1;
var stateCommand = {};
var stateCommandPropertyNames = ["stop", "takeoff", "land", "disableEmergency", "enableEmergency", "flip", "switchChannel"];
var lastStateCommand;
var lastStateId = -1;
var timeInterval = 100;

function resetStateCommand () {
    stateCommand = {stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
    lastStateCommand = {stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
}

function startManualOverride () {
    'use strict';
    // Setup Key Map for One-handed controls
    var forwardKey          = ['w', 'W'],
        backwardKey         = ['s', 'S'],
        leftKey             = ['a', 'A'],
        rightKey            = ['d', 'D'],
        upKey               = 'spacebar',
        downKey             = 'shift + spacebar',
        clockwiseKey        = ['e', 'E'],
        counterClockwiseKey = ['q', 'Q'],
        stopKey             = ['x', 'X'],
        takeoffKey          = ['t', 'T'],
        landKey             = ['r', 'R'],
        disableEmergencyKey = ['g', 'G'],
        enableEmergencyKey  = ['v', 'V'],
        flipKey             = ['f', 'F'],
        switchChannelKey    = ['c', 'C'];
    
    resetStateCommand();
    // Bind keyboard listeners
    keyboardJS.bind(forwardKey, function (keyboardEvent) {
        speedCommand.forward += speedIncrement.xAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.forward = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(backwardKey, function (keyboardEvent) {
        speedCommand.backward += speedIncrement.xAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.backward = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(leftKey, function (keyboardEvent) {
        speedCommand.left += speedIncrement.yAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.left = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(rightKey, function (keyboardEvent) {
        speedCommand.right += speedIncrement.yAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.right = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(upKey, function (keyboardEvent) {
        speedCommand.up += speedIncrement.zAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.up = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(downKey, function (keyboardEvent) {
        speedCommand.down += speedIncrement.zAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.down = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(clockwiseKey, function (keyboardEvent) {
        speedCommand.clockwise += speedIncrement.yawAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.clockwise = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(counterClockwiseKey, function (keyboardEvent) {
        speedCommand.counterClockwise += speedIncrement.yawAxis;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        speedCommand.counterClockwise = 0;
        pushCommands();
        return false;
    });
    keyboardJS.bind(stopKey, function (keyboardEvent) {
        stateCommand.stop = true;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(takeoffKey, function (keyboardEvent) {
        stateCommand.takeoff = true;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(landKey, function (keyboardEvent) {
        stateCommand.land = true;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(disableEmergencyKey, function (keyboardEvent) {
        stateCommand.disableEmergency = true;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(enableEmergencyKey, function (keyboardEvent) {
        stateCommand.enableEmergency = true;
        pushCommands();
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(flipKey, function (keyboardEvent) {
        //TODO: Determine which direction to flip
        stateCommand.flip;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(switchChannelKey, function (keyboardEvent) {
        stateCommand.switchChannel = true;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
}

function pushCommands () {
    'use strict';
    var presentTime = new Date();
    if (typeof lastTimeSpeedSent == "undefined" || presentTime.valueOf() - lastTimeSpeedSent.valueOf() >= timeInterval) {
        // Send commands
        socket.emit('manual-speed', speedCommand);
        
        lastTimeSpeedSent = presentTime;
    }
    
    var isDifferent = stateCommandPropertyNames.some(function (propertyName) {
        return this.currentValue[propertyName] != this.lastValue[propertyName];
    }, {currentValue: stateCommand, lastValue: lastStateCommand});
    
    if (isDifferent) {
        // Send commands
        stateCommand._id = presentTime.valueOf();
        socket.emit('manual-state', stateCommand);
        
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
