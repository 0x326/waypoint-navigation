//Continue near bottom

// browser-logic.js
const KEY_TO_CODE =  {"0":"96","1":"97","2":"98","3":"99","4":"100","5":"101","6":"102","7":"103","8":"104","9":"105","backspace":"8","tab":"9","return":"13","shift":"16","ctrl":"17","alt":"18","pausebreak":"19","capslock":"20","escape":"27"," ":"32","pageup":"33","pagedown":"34","end":"35","home":"36","left":"37","up":"38","right":"39","down":"40","+":"107","printscreen":"44","insert":"45","delete":"46",";":"186","=":"187","a":"65","b":"66","c":"67","d":"68","e":"69","f":"70","g":"71","h":"72","i":"73","j":"74","k":"75","l":"76","m":"77","n":"78","o":"79","p":"80","q":"81","r":"82","s":"83","t":"84","u":"85","v":"86","w":"87","x":"88","y":"89","z":"90","*":"106","-":"189",".":"190","/":"191","f1":"112","f2":"113","f3":"114","f4":"115","f5":"116","f6":"117","f7":"118","f8":"119","f9":"120","f10":"121","f11":"122","f12":"123","numlock":"144","scrolllock":"145",",":"188","`":"192","[":"219","\\":"220","]":"221","'":"222"};
var speedCommand = {forward:0, backward:0, left:0, right:0, up:0, down:0, clockwise:0, counterClockwise:0, stop:false, takeoff:false, land:false, disableEmergency:false, enableEmergency:false, flip:null, switchChannel:false};
var speedIncrement = {xAxis: 0.01, yAxis: 0.01, zAxis: 0.01, yawAxis: 0.1};
var lastTimeSent = undefined;
var timeInterval = 100;
function startManualOverride ()
{
    // Setup Key Map for One-handed controls
    var forwardKey          = 'w'
      , backwardKey         = 's'
      , leftKey             = 'a'
      , rightKey            = 'd'
      , upKey               = 'spacebar'
      , downKey             = 'shift + spacebar'
      , clockwiseKey        = 'e'
      , counterClockwiseKey = 'q'
      , stopKey             = 'x'
      , takeoffKey          = 't'
      , landKey             = 'r'
      , disableEmergencyKey = 'g'
      , enableEmergencyKey  = 'v'
      , flipKey             = 'f'
      , switchChannelKey    = 'c'
      ;
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
        speedCommand.stop = false;
        return false;
    });
    keyboardJS.bind(takeoffKey, function (keyboardEvent) {
        speedCommand.takeoff = true;
        return false;
    }, function (keyboardEvent) {
        speedCommand.takeoff = false;
        return false;
    });
    keyboardJS.bind(landKey, function (keyboardEvent) {
        speedCommand.land = true;
        return false;
    }, function (keyboardEvent) {
        speedCommand.land = false;
        return false;
    });
    keyboardJS.bind(disableEmergencyKey, function (keyboardEvent) {
        speedCommand.disableEmergency = true;
        return false;
    }, function (keyboardEvent) {
        speedCommand.disableEmergency = false;
        return false;//TODO: Continue here
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
function pushCommands ()
{
    var presentTime = new Date();
    if (typeof lastTimeSent == "undefined" || presentTime.valueOf() - lastTimeSent.valueOf() >= timeInterval)
    {
        // Send commands
        socket.emit('manual', speedCommand);
        // Update time
        lastTimeSent = presentTime;
    }
}