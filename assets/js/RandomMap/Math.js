//file is to hold all mathmatical structures and constant data. 


//constant definitions for basic mathmatical constance
const PI = 3.1415926535897932384626433832795028841971693993751058209749445923078164062;
const SQRT2 = 7.071;


//class helpers to make mathmatics similar
//due to no operator overloading or opperator overloading
//lets state a few constants.
    //x is either a float,int (or other number primitive) or an other vector or object with x and y defined
    //y is always a float or unused if x is an object or vector
    //v is always the 2 combined into an vector

//The following function is a simple macro like conversion function to help fix these issues
//pretty strait forward so no point break it down;
const floatObjectParser = (x,y) => ( y==undefined &&  typeof x ===  Number ? new vec2(x,x) : typeof x === Number ? new vec2(x,y) : new  vec2(x.x,x.y) );


class Vec2 
{
    //Basic vector2d math library class

    constructor(x=0,y=0) //give in 2 floats
    {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }
    add(x,y=undefined) 
    {
        //v is a new object
        let v = floatObjectParser(x,y);
        v.x += this.x;
        v.y += this.y;
        return v;
        
    }
    sub(x,y=undefined) 
    {
        let v = floatObjectParser(x,y);
        v.x -= this.x;
        v.y -= this.y;
        return v;
    }
    mul()
    {
        let v = floatObjectParser(x,y);
        v.x *= this.x;
        v.y *= this.y;
        return v;
    }
    div()
    {
        let v = floatObjectParser(x,y);
        v.x /= this.x;
        v.y /= this.y;
        return v;
    }
    sqlen() //squared length
    {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
    len() //vector length
    {
        return Math.sqrt(this.sqlen);
    }
    dist(v) //distance from v to this vector [shortest path]
    {
        return this.len(new Vec2(this.x - v.x, this.y- v.y))
    }
    equalTo(v)
    {
        return v.x == this.x && v.y == this.y;
    }
    lerp(v,w) //this represents a and v represents b and w represents the weight between a and b
    {
        return new Vec2(this.x*(1-w) + v.x*w, this.y*(1-w) + v.y*w);
    }
}

class Color
{
    constructor(r,g,b,a=1.0)
    {
        this.r = parseFloat(r);
        this.g = parseFloat(g);
        this.b = parseFloat(b);
        this.a = parseFloat(a);
    }
}

class Rect
{
    constructor(minX,minY,maxX,maxY) // all of type Number, must be the upper right most point and the lower left most point
    {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    width = () => Math.abs(this.maxX - this.minX); //just in case some one is sill and defines these wrong
    height = () => Math.abs(this.maxY - this.minY);
    convertxxyy() {return {xl: this.minX, xr: this.maxX, yt: this.minY, yb: this.maxY};} //convertions to voronoi aabb
}