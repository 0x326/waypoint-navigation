Navigation Module Pseudocode
============================
## Init
 - Define waypoint array (to act as a buffer so that multiple waypoints can be loaded and completed in sequence) (array of Objects)
 - Ask for waypoints

## AddWaypoint ( waypoint )
 - Waypoint must be an Object in this format: {prescript: function () { }, postscript: function () { }, gpsLocation: {x: 59..., y: 23} }
 - Append waypoint to buffer

## InsertWaypoint (waypoint )
 - Recall buffer
 - Insert waypoint before and shift others back

## ActivateWaypoint ( waypoint = {prescript:function, postscript:function, location:null } )
 - Check waypoint parameter
 - If its location is not `null`, insert new waypoint in front of buffer
 - If its location is `null`, check the waypoint buffer for next waypoint
 - If the buffer is empty, `exit`
 - Create new mission for waypoint
     - Recall GPS location of waypoint
     - Get GPS location of drone
     - Calculate vector to waypoint relative to drone
         - Let $(waypoint)$ be the location of the waypoint
         - Let $(drone)$ be the location of the drone
         - $(waypoint) - (drone) = <resultingVector>$
     - Calculate angle of vector in relation to NSEW
         - Recall X and Y components of resulting vector
         - $\tan{\theta} = y/x$
         - If x > 0 && y > 0: $\theta + 0\pi$ 
         - If x < 0 && y > 0: $\pi - \theta$
         - If x < 0 && y < 0: $\theta + \pi$
         - If x > 0 && y > 0: add 0 to $2\pi - \theta$
         - rotate ($\theta$)
     - Zero drone navigation map
     - Execute prescript
     - Take off
     - Rotate so that drone is forward-facing
     - Go (X component, Y component)
     - On mission completion
         - Get drone's GPS location
         - Compare with waypoint GPS location
         - If distance between the two is greater than the tolerance, activate waypoint a second time
         - If distance is acceptable, execute postscript, remove waypoint from buffer, and setTimeout( ActivateWaypoint, 0)

## ClearBuffer ()
 - Clear buffer