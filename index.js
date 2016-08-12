// waypoint-navigation/index.js
// July 15, 2016
// John Meyer
// This code serves as an additional layer on top of a custom version of Eschnou's Ardrone-autonomy; 
// It enables travel to multiple waypoints while using a GPS to verify the drone actually flew to the waypoint

'use strict';

//// Init ////
const autonomy = require('ardrone-autonomy-custom');
const date = require("dateformat");
const sylvester = require("sylvester");
const convert = require("convert-units");
const geolib = require("geolib");
const chalk = require("chalk");

// Should the drone rotate to face
var shouldRotateTowardsWaypoint = true;
var shouldLandWhenDone = true;

var pidOptions = {
    x_axis:   {p_constant: 0.5, i_constant: 0, d_constant: 0.35}, 
    y_axis:   {p_constant: 0.5, i_constant: 0, d_constant: 0.35}, 
    z_axis:   {p_constant: 0.8, i_constant: 0, d_constant: 0.35}, 
    yaw_axis: {p_constant: 1.0, i_constant: 0.1, d_constant: 0.30}};

var missionOptions = {
    pid: pidOptions,
    droneConfiguration: [
        {key:"general:navdata_demo", value: false},
        /*{key:"control:outdoor", value: false},
        {key:"control:flight_without_shell", value: false},
        {key:"control:altitude_min", value: 1.2},
        {key:"control:altitude_max", value: 10},
        {key:"control:control_yaw", value: 1.6}*/
        
        // This setting will cause the drone firmware to control itself and hover on top of a roundel (see SDK 2)
        // This setting requires a value, which is unknown to me, so it is undefined
        //{key:"control:flying_mode", value:HOVER_ON_TOP_OF_ROUNDEL}
        
        // I believe this configuration will tell the drone firmware to search for a roundel with its vertical camera
        //{key:"detect:detections_select_v", value:3}
    ]};
var mission = autonomy.createMission(missionOptions);
    mission.log("/tmp/mission-" + date(new Date(), "yyyy-mm-dd HH-MM-ss") + ".csv");
// Diagnostic Code
/*mission.control().on('goalReached', function () { console.log("goal reached"); });
mission.control().on('goalLeft', function () { console.log("goal left"); });*/

// startFlight acts as a prescript to the first waypoint
// It tells the drone to takeoff so that the drone can move
function startFlight (callback)
{
    if (typeof mission.ftrim == "function")
        mission.ftrim();
    mission.takeoff();
    if (typeof mission.calibrate == "function")
        mission.wait(4000).calibrate();
    mission.zero();
    var self = this;
    mission.run(function (error, result) {
        callback();
    });
    return;
}

module.exports = WaypointNavigator;
function WaypointNavigator ()
{
    // The waypoint buffer is like a To-Do list of waypoints yet to reach. The waypoints are targeted in succession
    this.waypointBuffer = [ new this.Waypoint(0, 0, 1, "m", startFlight) ]; // Fill the buffer with a waypoint that goes nowhere
    // A boolean value which indicates whether there is a thread executing the waypoints in the buffer.
    // It is to prevent two waypoints from being executed at the same time
    this.isAllowedToActivateWaypoints = true;
    // A memo to store an estimates of the drone's location when devices such as GPS are unavailable
    this.locationCache = {coordinateGrid: [0, 0, 0], gps: undefined};
}
WaypointNavigator.prototype.mission = function ()
{
    return mission;
}
// Turns off the controller. (Drone is likely to crash soon if it is not controlled by anything)
WaypointNavigator.prototype.seizeControl = function ()
{
    mission.control().disable();
    //TODO: Do more stuff
    //mission.client().land();
    return;
}
// Turns on the controller
WaypointNavigator.prototype.releaseControl = function ()
{
    mission.control().enable();
}

//// Build Waypoint System ////
// doNothing is a dummy prescript/postscript that does nothing
// It acts as a placeholder
var doNothing = function (callback)
{
    callback();
};

// This function creates a Waypoint object
WaypointNavigator.prototype.Waypoint = function (xCoordinate, yCoordinate, zCoordinate, units, prescript, postscript)
{
    // xCoordinate, yCoordinate, zCoordinate accept numbers
    // units accepts a String
    // prescript and postscript accept functions (to be executed before/after the waypoint, respectively)
    
    // Set default values
    xCoordinate = typeof(xCoordinate) == "undefined" ? 0 : xCoordinate;
    yCoordinate = typeof(yCoordinate) == "undefined" ? 0 : yCoordinate;
    zCoordinate = typeof(zCoordinate) == "undefined" ? 1 : zCoordinate;
    units = typeof(units) == "undefined" ? "m" : units;
    prescript = typeof(prescript) == "undefined" ? doNothing : prescript;
    postscript = typeof(postscript) == "undefined" ? doNothing : postscript;
    
    // Check parameters
    if (typeof(xCoordinate) != "number")
        // Coordinate parameter is not correct
        throw new Error("xCoordinate must be a number, not " + typeof(xCoordinate));
    else if (typeof(yCoordinate) != "number")
        // Coordinate parameter is not correct
        throw new Error("yCoordinate must be a number, not " + typeof(yCoordinate));
    else if (typeof(zCoordinate) != "number")
        // Coordinate parameter is not correct
        throw new Error("zCoordinate must be a number, not " + typeof(zCoordinate));
    else if (typeof(units) != "string")
        // Unit parameter is not correct
        throw new Error("Units must be a String, not " + typeof(units));
    else if (typeof(prescript) != "function")
        // Script parameter is not functions
        throw new Error("Prescript must be a function, not " + typeof(prescript));
    else if (typeof(postscript) != "function")
        // Script parameter is not functions
        throw new Error("Postscript must be a function, not " + typeof(postscript));
    else ; // Parameters are good
    
    // Create Waypoint
    this.location = [xCoordinate, yCoordinate, zCoordinate];
    this.locationUnits = units;
    this.prescript = prescript;
    this.prescript.isCalled = false;
    this.postscript = postscript;
    if (this.prescript != doNothing)
        this.hasPrescript = true;
    else
        this.hasPrescript = false;
    if (this.postscript != doNothing)
        this.hasPostscript = true;
    else
        this.hasPostscript = false;
}
// Checks a waypoint to make sure it is valid
WaypointNavigator.prototype.isWaypoint = function (waypoint)
{
    if (typeof(waypoint.location) != "object")
        // Location is not an array
        return false;
    else if (typeof(waypoint.location[0]) != "number")
        // X coordinate component is not a number
        return false;
    else if (typeof(waypoint.location[1]) != "number")
        // Y coordinate component is not a number
        return false;
    else if (typeof(waypoint.location[2]) != "number")
        // Z coordinate component is not a number
        return false;
    else if (typeof(waypoint.locationUnits) != "string")
        // Unit parameter is not correct
        return false;
    else if (typeof(waypoint.prescript) != "function")
        return false;
    else if (typeof(waypoint.postscript) != "function")
        return false;

    // Waypoint is a valid waypoint
    return true;
}

// Adds a waypoint to the buffer
WaypointNavigator.prototype.addWaypoint = function (waypoint)
{
    console.log(chalk.dim("Adding waypoint"));
    if(this.isWaypoint(waypoint))
        this.waypointBuffer.push(waypoint);
    else
        throw new Error("The argued waypoint is not actually a waypoint");
}

// Inserts a waypoint at the given index (at the front, by default)
WaypointNavigator.prototype.insertWaypoint = function (waypoint, arrayIndex)
{
    console.log(chalk.dim("Inserting waypoint"));
    // Setup default values
    arrayIndex = typeof arrayIndex == "undefined" ? 0 : arrayIndex;
    if(this.isWaypoint(waypoint))
        this.waypointBuffer.splice(arrayIndex, 0, waypoint); // starting at `arrayIndex`, remove ``0 elements, then add `waypoint`; automatically assigns result to itself
    else
        throw new Error("the argued waypoint is not actually a waypoint");
    return;
}

// Ejects the waypoint at the given index (the one at the front, by default)
WaypointNavigator.prototype.removeWaypoint = function (arrayIndex)
{
    console.log(chalk.dim("Removing waypoint"));
    // Setup default values
    arrayIndex = typeof arrayIndex == "undefined" ? 0 : arrayIndex;
    this.waypointBuffer.splice(arrayIndex, 1); // removes `1` element starting at `arrayIndex`; autonmatically assigns result to itself
    return;
}

// Adds a dummy waypoint with the prescript to hover for the given time
WaypointNavigator.prototype.addLoiterWaypoint = function (time)
{
    console.log(chalk.dim("Adding loiter waypoint"));
    if (this.waypointBuffer.length > 0)
    {
        var waypoint = this.waypointBuffer[this.waypointBuffer.length - 1];
        waypoint.prescript = function () {
            mission.hover(time);
        }
        waypoint.postscript = doNothing;
    }
    else
        var waypoint = new this.Waypoint(
            this.locationCache.coordinateGrid[0],
            this.locationCache.coordinateGrid[1], 
            this.locationCache.coordinateGrid[2], 
            "m", 
            function () {
                mission.hover(time);
            },
            doNothing);
    if(this.isWaypoint(waypoint))
        this.waypointBuffer.push(waypoint);
    else
        throw new Error("The loiter waypoint is not actually a waypoint. Check prior item in buffer");
}

// Converts a waypoint's coordinate point to the desired units
WaypointNavigator.prototype.convertWaypoint = function (waypointLocation, currentUnits, desiredUnits)
{
    console.log(chalk.dim("Converting waypoint"));
    waypointLocation[0] = convert(waypointLocation[0]).from(currentUnits).to(desiredUnits);
    waypointLocation[1] = convert(waypointLocation[1]).from(currentUnits).to(desiredUnits);
    waypointLocation[2] = convert(waypointLocation[2]).from(currentUnits).to(desiredUnits);
    return waypointLocation;
}

// Gets the drone's location in relation to its starting location
WaypointNavigator.prototype.getDroneLocation = function ()
{
    console.log(chalk.dim("Getting drone location: ") + chalk.dim(JSON.stringify(this.locationCache.coordinateGrid)));
    return this.locationCache.coordinateGrid;
}

// Gets the drone's GPS location
WaypointNavigator.prototype.getDroneGpsLocation = function ()
{
    console.log(chalk.dim("Getting drone GPS location"));
    //mission.control()._ekf._last_gps_lat;
    return; //TODO: Add code to get drone's GPS location
}

// Get the drone's absolute bearing (see flight terminology)
WaypointNavigator.prototype.getDroneAbsoluteBearing = function ()
{
    return mission.control()._ekf.state().absoluteYaw;
}

// Send drone to a next waypoint or to the given waypoint
WaypointNavigator.prototype.activateWaypoint = function (waypoint) 
{   //TODO: Check buffer overide functionality
    
    // If we are not allow to activate waypoints, quit now
    if (!this.isAllowedToActivateWaypoints)
        return;
    
    // If waypoint, override buffer
    // Check to see if waypointBuffer is overridden with new waypoint
    if (waypoint instanceof this.Waypoint)
        // Insert to front then follow buffer as normal
        this.insertWaypoint(waypoint);
    else if (this.waypointBuffer.length > 0)
        // Buffer not overridden but it has more waypoints. Proceed
        ;
    else
    {
        // There is no waypoint parameter and the waypoint buffer is empty so
        // the buffer must be complete
        console.log(chalk.green("!!!! ") + "Buffer Complete" + chalk.green(" !!!!"));
        this.isRunningWaypointBuffer = false;
        if (shouldLandWhenDone)
        {
            mission.control().disable();
            mission.client().stop();
            mission.client().land();
        }
        // There are no waypoints in buffer; Quit
        return;
    }
    
    // Grab waypoint from buffer
    waypoint = this.waypointBuffer[0];
    console.log(chalk.green("Activating waypoint: " + waypoint.location));
    // Call the prescript only once
    if (!waypoint.prescript.isCalled)
    {
        console.log("Executing prescript");
        // Activate its prescript
        this.waypointBuffer[0].prescript.isCalled = true;
        try { waypoint.prescript(this.activateWaypoint.bind(this)); }
        catch (err)
        {
            err.message = "Error while executing prescript: " + err.message;
            throw err;
            var self = this;
            setImmediate(function () {
                self.activateWaypoint();
            });
        }
        finally
        {
            return;
        }
    }
    // Recall location of waypoint
    //   waypoint.location;
    //   waypoint.locationUnits;
    if (waypoint.locationUnits == "GPS")
    {
        console.log(chalk.dim("Waypoint is a GPS coordinate"));
        // Get GPS location of drone
        var droneGpsLocation = this.getDroneGpsLocation();
        // Calculate distance to waypoint
        var displacement = geolib.getDistance(
            {latitude: droneGpsLocation[0], longitude: droneGpsLocation[1]},
            {latitude: waypoint.location[0], longitude: waypoint.location[1]},
            1, 2);
        var displacementBearing = geolib.getCompassDirection(
            {latitude: droneGpsLocation[0], longitude: droneGpsLocation[1]},
            {latitude: waypoint.location[0], longitude: waypoint.location[1]}
        ).bearing;
        // Find X and Y components of displacement vector
        var displacementVector = $V([Math.cos(displacementBearing) * displacement, Math.sin(displacementBearing) * displacement]);
        // Get angle of drone
        var droneBearing = this.getDroneAbsoluteBearing();
        if (droneBearing == null)
            droneBearing = displacementBearing;
        // Calculate angle needed to rotate so that the drone is facing the waypoint
        var yawAdjustment = displacementBearing - droneBearing;
    }
    else
    {
        console.log(chalk.dim("Waypoint is a coordinate"));
        // Get location of drone
        var droneLocation = this.getDroneLocation();
        // Convert waypoint to meters
        waypoint.location = this.convertWaypoint(waypoint.location, waypoint.locationUnits, "m");
        waypoint.locationUnits = "m";
        // Calculate displacement to waypoint relative to drone in 2D
        var displacementVector = 
            $V(waypoint.location.slice(0, 2))
            .subtract(
                $V(droneLocation.slice(0, 2))
            );
        // Calculate angle of vector (in radians)
        console.log(chalk.inverse.blue("Displacement Vector: ", displacementVector.elements));
        var displacementAngle = Math.atan2(displacementVector.elements[1], displacementVector.elements[0]);
        if (displacementAngle != null)
        {
            // Get angle of drone
            var droneBearing = this.getDroneAbsoluteBearing();
            console.log(chalk.blue("Drone Bearing: ", droneBearing / Math.PI * 180));
            console.log(chalk.blue("Displacement Angle: ", displacementAngle / Math.PI * 180));
            if (droneBearing == null)
                droneBearing = displacementAngle;
            // Calculate angle needed to rotate so that the drone is facing the waypoint
            var yawAdjustment = displacementAngle - droneBearing;
        }
        else
        {
            // The displacement has no angle, so adjsut zero
            var yawAdjustment = displacementAngle = 0;
        }
    }
    // Convert yaw adjsutment to degrees and normalize
    yawAdjustment *= 180 / Math.PI;
    while (yawAdjustment >  180) { yawAdjustment -= 360;}
    while (yawAdjustment < -180) { yawAdjustment += 360;}
    console.log(chalk.dim.red("yawAdjustment: " + yawAdjustment));
    
    //// Craft mission ////
    console.log(chalk.dim("Crafting mision"));
    mission.zero();
    mission.hover(100);
    if (shouldRotateTowardsWaypoint)
    {
        var displacement= Math.hypot(displacementVector.elements[0], displacementVector.elements[1]);
        // Rotate drone in small increments so that it does not flip
        // `incrementalAngleAdjustment` is in degrees
        /*for (var incrementalAngleAdjustment = 20; Math.abs(yawAdjustment) > 0.1; yawAdjustment -= rotationAmmount)
        {
            var rotationAmmount;
            if (yawAdjustment < -incrementalAngleAdjustment) {
                rotationAmmount = -incrementalAngleAdjustment;
            } else if (yawAdjustment > incrementalAngleAdjustment) {
                rotationAmmount = incrementalAngleAdjustment;
            } else {
                rotationAmmount = yawAdjustment;
            }
            mission.cw(rotationAmmount);
        }*/
        if (Math.abs(yawAdjustment) > 0.1)
            mission.cw(yawAdjustment);
        mission.zero();
        // Go to waypoint
        mission.go({x: displacement, y: 0, z:waypoint.location[2], yaw:0}).hover(100);
    }
    else
        mission.go({x: displacementVector.elements[0], y: displacementVector.elements[1], z: waypoint.location[2], yaw:0}).hover(100);
    
    //// Run mission ////
    console.log(chalk.dim("Running mission"));
    mission.run(this.reviewMission.bind(this));
    //// Mission Complete ////
}

WaypointNavigator.prototype.reviewMission = function (error, results) 
{
    if (typeof error == "object" && error instanceof Error && error.message == "Mission Aborted")
    {
        console.log("Mission Aborted");
        return;
    }
    console.log(chalk.dim("Reviewing mission"));
    //TODO: Add Error handling
    // Get waypoint from buffer
    var waypoint = this.waypointBuffer[0];
    if (waypoint.locationUnits == "GPS")
    {
        // Get GPS location of drone
        var droneGpsLocation = this.getDroneGpsLocation();
        // Calculate distance to waypoint
        var displacement = geolib.getDistance({latitude: droneGpsLocation[0], longitude: droneGpsLocation[1]},
                                              {latitude: waypoint.location[0], longitude: waypoint.location[1]}, 1, 2);
        if (displacement > 0.1) // 0.1 is the horizontal tolerance (in meters)
        {
            // Reactivate waypoint
            console.log(chalk.red.inverse("Not close enough. Reactivating mission"));
            this.activateWaypoint();
            return;
        }
        // If not, displacement is acceptable. Proceed
        console.log(chalk.green.inverse("Waypoint met!"));
        // Update location cache
        this.locationCache.gps = waypoint.location; //TODO: Add more
    }
    else
    {
        // Get location of drone
        var droneLocation = waypoint.location; //= self.getDroneLocation();
        // Calculate displacement to waypoint relative to drone
        var displacement = Math.hypot(droneLocation[0] - waypoint.location[0], droneLocation[1] - waypoint.location[1]);
        if (displacement > 0.1) // 0.1 is the horizontal tolerance (in meters)
        {
            // Reactivate waypoint
            console.log(chalk.red.inverse("Not close enough. Reactivating mission"));
            this.activateWaypoint();
            return;
        }
        // If not, displacement is acceptable. Proceed to execute postscript
        console.log(chalk.green.inverse("Waypoint met!"));
        // Update location cache
        this.locationCache.coordinateGrid = waypoint.location; //TODO: Add more
    }
    var clearWaypoint = function () {
        // Remove waypoint from buffer
        this.removeWaypoint();
        this.isRunningWaypointBuffer = false; //TODO: This is a quick fix. Fix this: what if another thread jumps in
        // Activate next waypoint
        var self = this;
        setImmediate(function() { self.activateWaypoint(); });
    };
    // Execute postscript
    try { waypoint.postscript(clearWaypoint.bind(this)); }
    catch (err2)
    {
        err2.message = "Error while executing postscript: " + err2.message;
        throw err2;
        clearWaypoint();
    }
}
