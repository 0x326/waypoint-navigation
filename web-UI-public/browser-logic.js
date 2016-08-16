// browser-logic.js
var speedCommand = {forward:0, backward:0, left:0, right:0, up:0, down:0, clockwise:0, counterClockwise:0, stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
var speedIncrement = {xAxis: 0.01, yAxis: 0.01, zAxis: 0.01, yawAxis: 0.1};
var lastTimeSent = undefined;
var timeInterval = 100;

function startManualOverride () {
    // Setup Key Map for One-handed controls
    var forwardKey          = 'w',
        backwardKey         = 's',
        leftKey             = 'a',
        rightKey            = 'd',
        upKey               = 'spacebar',
        downKey             = 'shift + spacebar',
        clockwiseKey        = 'e',
        counterClockwiseKey = 'q',
        stopKey             = 'x',
        takeoffKey          = 't',
        landKey             = 'r',
        disableEmergencyKey = 'g',
        enableEmergencyKey  = 'v',
        flipKey             = 'f',
        switchChannelKey    = 'c';
    
    // Disable controller
    //waypointNavigation.mission().control().disable();
    // Bind keyboard listeners
    keyboardJS.bind(forwardKey, function (keyboardEvent) {
        speedCommand.forward += speedIncrement.xAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.forward = 0;
        return false;
    });
    keyboardJS.bind(backwardKey, function (keyboardEvent) {
        speedCommand.backward += speedIncrement.xAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.backward = 0;
        return false;
    });
    keyboardJS.bind(leftKey, function (keyboardEvent) {
        speedCommand.left += speedIncrement.yAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.left = 0;
        return false;
    });
    keyboardJS.bind(rightKey, function (keyboardEvent) {
        speedCommand.right += speedIncrement.yAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.right = 0;
        return false;
    });
    keyboardJS.bind(upKey, function (keyboardEvent) {
        speedCommand.up += speedIncrement.zAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.up = 0;
        return false;
    });
    keyboardJS.bind(downKey, function (keyboardEvent) {
        speedCommand.down += speedIncrement.zAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.down = 0;
        return false;
    });
    keyboardJS.bind(clockwiseKey, function (keyboardEvent) {
        speedCommand.clockwise += speedIncrement.yawAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.clockwise = 0;
        return false;
    });
    keyboardJS.bind(counterClockwiseKey, function (keyboardEvent) {
        speedCommand.counterClockwise += speedIncrement.yawAxis;
        return false;
    }, function (keyboardEvent) {
        speedCommand.counterClockwise = 0;
        return false;
    });
    keyboardJS.bind(stopKey, function (keyboardEvent) {
        speedCommand.stop = true;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(takeoffKey, function (keyboardEvent) {
        speedCommand.takeoff = true;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(landKey, function (keyboardEvent) {
        speedCommand.land = true;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(disableEmergencyKey, function (keyboardEvent) {
        speedCommand.disableEmergency = true;
        return false;
    }, function (keyboardEvent) {
        return false;
    });
    keyboardJS.bind(enableEmergencyKey, function (keyboardEvent) {
        speedCommand.enableEmergency = true;
        return false;
    });
    keyboardJS.bind(flipKey, function (keyboardEvent) {
        //TODO: Determine which direction to flip
        speedCommand.flip;
        return false;
    });
    keyboardJS.bind(switchChannelKey, function (keyboardEvent) {
        speedCommand.switchChannel = true;
        return false;
    });
    speedCommand;
}
function pushCommands () {
    var presentTime = new Date();
    if (typeof lastTimeSent == "undefined" || presentTime.valueOf() - lastTimeSent.valueOf() >= timeInterval)
    {
        // Send commands
        socket.emit('manual', speedCommand);
        // Update time
        lastTimeSent = presentTime;
    }
}
