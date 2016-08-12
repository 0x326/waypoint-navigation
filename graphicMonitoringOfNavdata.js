// Set-up Webserver
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 3000;

server.listen(port);
console.log("Listening on Port %d", port);
app.use(express.static('../graphic-object-monitoring/public'));

io.on('connection', function (socket) {
    ;
});

// Set-up drone controller
const WaypointNavigator = require("./");
var waypointNavigation = new WaypointNavigator();
var arDroneConstants = require('ardrone-autonomy-custom/node_modules/ar-drone/lib/constants');

//waypointNavigation.mission().control().enable();
function navdata_option_mask(c) {
  return 1 << c;
}
function enableAllOptions ()
{
    var navdata_options = (
        navdata_option_mask(arDroneConstants.options.DEMO)
      | navdata_option_mask(arDroneConstants.options.TIME)
      | navdata_option_mask(arDroneConstants.options.RAW_MEASURES)
      | navdata_option_mask(arDroneConstants.options.PHYS_MEASURES)
      | navdata_option_mask(arDroneConstants.options.GYROS_OFFSETS)
      | navdata_option_mask(arDroneConstants.options.EULER_ANGLES)
      | navdata_option_mask(arDroneConstants.options.REFERENCES)
      | navdata_option_mask(arDroneConstants.options.TRIMS)
      | navdata_option_mask(arDroneConstants.options.RC_REFERENCES)
      | navdata_option_mask(arDroneConstants.options.PWM)
      | navdata_option_mask(arDroneConstants.options.ALTITUDE)
      | navdata_option_mask(arDroneConstants.options.VISION_RAW)
      | navdata_option_mask(arDroneConstants.options.VISION_OF)
      | navdata_option_mask(arDroneConstants.options.VISION)
      | navdata_option_mask(arDroneConstants.options.VISION_PERF)
      | navdata_option_mask(arDroneConstants.options.TRACKERS_SEND)
      | navdata_option_mask(arDroneConstants.options.VISION_DETECT)
      | navdata_option_mask(arDroneConstants.options.WATCHDOG)
      | navdata_option_mask(arDroneConstants.options.ADC_DATA_FRAME)
      | navdata_option_mask(arDroneConstants.options.VIDEO_STREAM)
      | navdata_option_mask(arDroneConstants.options.GAMES)
      | navdata_option_mask(arDroneConstants.options.PRESSURE_RAW)
      | navdata_option_mask(arDroneConstants.options.MAGNETO)
      | navdata_option_mask(arDroneConstants.options.WIND_SPEED)
      | navdata_option_mask(arDroneConstants.options.KALMAN_PRESSURE)
      | navdata_option_mask(arDroneConstants.options.HDVIDEO_STREAM)
      | navdata_option_mask(arDroneConstants.options.WIFI)
      | navdata_option_mask(arDroneConstants.options.ZIMMU_3000) // GPS data
      //| navdata_option_mask(arDroneConstants.options.CKS) // Option is not implemented yet
    );
    return navdata_options;
}
waypointNavigation.mission().client().on('navdata', function (data) {
    io.emit('navdata', data);
});
waypointNavigation.mission().client().config('general:navdata_demo', false);
//waypointNavigation.mission().client().config('general:navdata_options', navdata_options);
waypointNavigation.activateWaypoint();
var exiting = false;
process.on('SIGINT', function() {
    if (exiting) {
        process.exit(0);
    } else {
        console.log('Got SIGINT. Landing, press Control-C again to force exit.');
        exiting = true;
        waypointNavigation.mission().control().disable();
        waypointNavigation.mission().client().land(function() {
            process.exit(0);
        });
    }
});
