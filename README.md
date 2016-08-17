Waypoint Naviagation
====================

This software builds off of [eschnou/ardrone-autonomy](https://github.com/eschnou/ardrone-autonomy) to allow the Parrot AR.Drone to fly towards a tentative list of waypoints.  The waypoints can be relative to the drone's starting position or GPS coordinates. Mixing the two is not currently supported. The positive X axis is north while the positive Y axis is east.

This software supports "prescripts" and "postscripts", Functions to be called before a waypoint is activated and after the waypoint is met.  Presently, the first default waypoint has a prescript for a flat trim, takeoff, and a compass calibration before it goes to the point (0m, 0m, 1m).  Then user-addded waypoints will be activated.  After all waypoint are complete, the drone lands. 

Specifications for Text-Based UI
--------------------------------

Objectives: Enable the User to

 - list waypoints
 - add waypoint
 - insert waypoint
 - remove waypoint
 - start route
 - list item
 - pause route
 - use GPS coordinates and data
     - Make calculations to mantain a GPS coordinate estimate in the case of signal loss
 
### Command line syntax

#### Essential Syntax
 - `.help`: Shows a list of all the commands supported by the REPL (Read-Eval-Print-Loop)
 - `.list`: Outputs a list of waypoints with their coordinates
 - `.add [X,Y,Z]=Number [..] units`: Adds a coordinates of waypoint to its To-Do list
     - `X`, `Y`, and `Z` represent the coordinate components of the waypoint.  
     - units
 - `.add loiter [seconds]`: Adds a dummy waypoint that makes the drone loiter for the given time
 - `.insert [index] [X,Y,Z]=Number [..] units`: Inserts a waypoint to the front of the list of waypoints
 - `.remove [waypointNumber]`: 
 - `.start`: Tells drone to go to the next given waypoint
 - `.abort`: Tells the drone to abort the current waypoint and stop. Upon resuming, the drone will continue to the waypoint that was interrupted
 - `.erase`: Clears all waypoints from the list
 - `.exit`: Tells the drone to stop and land.  Once the drone lands, the program quits

#### Aditional Syntax
Everything in this list is done automatically so they do not need to be called.

 - `.takeoff`: Tells the drone to takeoff. If there is an active waypoint, the drone will move towards it again
 - `.land`: Tells the drone to land but keeps active any active waypoint
 - `.battery`: Returns the drone's current battery level
 - `.ftrim`: Perfroms a flat trim. This only can be done while the drone is landed
 - `.enableEmergency`: Enables an emergency turn off. Rotors will stop spinning immediately and the drone will fall out of the sky. A gentle landing with `.land` is much more preferrable.  
 - `.disableEmergency`: Disables the emergency turn off. (The drone must be upright)

#### Syntax for Manual Flight
This syntax is intended to be an API for another program, not to be typed by hand. Though some of these commands may seem redundant with some of the above, these manual commands are slightly lower-level, only doing precisely what is commanded them.

 - `.manual-forward [speed]`
 - `.manual-backward [speed]`
 - `.manual-left [speed]`
 - `.manual-right [speed]`
 - `.manual-clockwise [speed]`
 - `.manual-counterClockwise [speed]`
 - `.manual-stop`
 - `.manual-takeoff`
 - `.manual-land`
 - `.manual-flip [direction]`
     - `direction` could be `forward`, `backward`, `left`, or `right`
 - `.manual-calibrate`: Calibrates the compass

#### Syntax for Diagnostics
 - `.navdata`: Opens a socket.io server and forwards all the navigation data sent from the drone ("navdata"); Listens on localhost:3000. Use [0x326/graphic-object-monitoring](https://github.com/0x326/graphic-object-monitoring) to visualize navdata

### Instructions for manual override
 - `.manual`: Opens a socket.io server on port 3000 and listens for manual flight instructions from the web browser
 - Key Map:
     - WSAD >> Forward, Backward, Left, and Right
     - QE >> Counterclockwise and clockwise
     - Spacebar/Shift+Spacebar >> up and down
     - X >> stop
     - TR >> takeoff and land

### Notes
 - Use `dms` package for GPS unit standardization?
 - Use a PID controller for the manual override instead of a cubic bezier curve?
