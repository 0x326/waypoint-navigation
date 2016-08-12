const WaypointNavigator = require("./");
var waypointNavigation = new WaypointNavigator();

waypointNavigation.mission().control()._pid_x.configure();
