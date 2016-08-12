console.log("::::::::: WARNING :::::::::");
console.log("::: Executing Scrap Code :::");
// NOT NEEDED
WaypointNavigator.prototype.convertToBaseUnit = function (vector)
{   // This function converts any unit into its base unit and changes the value accordingly
    // Ex: kilometer >> meter
    // Ex: milimeter >> meter
    vector.units.search("kilometer");
    
}

WaypointNavigator.prototype.convertArray = function (array, desiredUnits)
{
    // Convert to a predetermined unit of distance
    if(array.units == "[meter]")
        ; // Good to go
    else if (array.units == "GPS")
        ; //TODO: Use conversion factors
    
    if (desiredUnits == "GPS")
        ; //TODO: Use conversion factors
    else if (desiredUnits == "[meter]")
        ; // Good to go
    return array;
}
WaypointNavigator.prototype.Vector = function (units, x, y, z)
{
    // Set default values (setting them in function header not allowed)
    units = typeof(units) == undefined ? "meter" : units;
    // Note: X, Y, Z are allowed to be undefined, only one of them must be
    
    // Make vector
    this.units = units;
    this.x = x;
    this.y = y;
    this.z = z;
    this.magnitude = function ()
    {
        return Math.hypot(this.x, this.y);
    }
    this.angle = function (units)
    {
        // Set default values
        units = typeof(units) == undefined ? "rad" : units;
        
        // Calculate Angle
        if (this.magnitude() == 0)
            return 0; // A number must be given, but in actuality, there is no angle
        else if (this.x == 0)
        {
            if (this.y > 0)
                return Math.PI/2;
            else // this.y negative
                return 3*Math.PI/2;
        }
        else if (this.y == 0)
        {
            if (this.x > 0)
                return 0;
            else // this.x negative
                return Math.PI;
        }
        else
        {
            var theta = Math.atan2(this.y/this.x);
            /***** TODO: Make sure this still works
            if (this.x > 0 && this.y > 0)
                theta += 0*Math.PI;
            else if (this.x < 0 && this.y > 0)
                theta = Math.PI - theta;
            else if (this.x < 0 && this.y < 0)
                theta += Math.PI;
            else if (this.x > 0 && this.y > 0)
                theta = 2*Math.PI - theta;
                ****/
            return theta;
        }
    }
    this.isVector = function ()
    {
        if (typeof(this.x) != "number" && typeof(this.y) != "number" && typeof(this.z) != "number")
            return false;
        else if (typeof(this.units) != "string")
            return false;
        else
            return true;
    }
    // Sanity Check
    if(!this.isVector())
        throw new Error("Vector is not valid. " + JSON.stringify(this)); //TODO: Add more troubleshooting logic
}
WaypointNavigator.prototype.convertVector = function (vector, desiredUnits)
{
    // Convert to a predetermined unit of distance
    if(vector.units == "meter")
        ; // Good to go
    else if (vector.units == "GPS")
        ; //TODO: Use conversion factors
    if (desiredUnits == "GPS")
        ; //TODO: Use conversion factors
    else if (desiredUnits == "meter")
        ; // Good to go
    return vector;
}
WaypointNavigator.prototype.subtractVector = function (minuend, subtrahend)
{   // Subtacts two vectors
    // Ex: minuend - subtrahend = difference
    
    // If any coordination value is undefined, assume it is zero
    try { minuend.x = minuend.x; } catch (err) { minuend.x = 0; }
    try { minuend.y = minuend.y; } catch (err) { minuend.y = 0; }
    try { minuend.z = minuend.z; } catch (err) { minuend.z = 0; }
    
    try { subtrahend.x = subtrahend.x; } catch (err) { subtrahend.x = 0; }
    try { subtrahend.y = subtrahend.y; } catch (err) { subtrahend.y = 0; }
    try { subtrahend.z = subtrahend.z; } catch (err) { subtrahend.z = 0; }
    if (minuend.units == subtrahend.units)
        return new Vector(minuend.units, minuend.x - subtrahend.x, minuend.y - subtrahend.y, minuend.z - subtrahend.z);
    else
    {
        // Convert subtrahend's units to minuend's units
        subtrahend = convertVector(subtrahend, minuend.units);
        return new Vector(minuend.units, minuend.x - subtrahend.x, minuend.y - subtrahend.y, minuend.z - subtrahend.z);
    }
}
