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
const floatObjectParser = (x,y) => ( y==undefined &&  typeof x ===  Number ? new Vec2(x,x) : typeof x === Number ? new Vec2(x,y) : new  Vec2(x.x,x.y) );

class Vec2 
{
    //Basic vector2d math library class

    constructor(x=0,y=0) //give in 2 floats
    {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }
    add(v) 
    {
        //v is a new object
        let p = new Vec2(v.x,v.y)
        p.x += this.x;
        p.y += this.y;
        return p;
        
    }
    sub(v) 
    {
        let p = new Vec2(v.x,v.y)
        p.x -= this.x;
        p.y -= this.y;
        return p;
    }
    mul(v) 
    {
        let p = new Vec2(v.x,v.y)
        p.x *= this.x;
        p.y *= this.y;
        return p;
    }
    div(v) 
    {
        let p = new Vec2(v.x,v.y)
        p.x /= this.x;
        p.y /= this.y;
        return p;
    }
    sqlen() //squared length
    {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
    len() //vector length
    {
        return Math.sqrt(this.sqlen());
    }
    dist(v) //distance from v to this vector [shortest path]
    {
        return (new Vec2(this.x - v.x, this.y- v.y)).len();
    }
    normalize() 
    {
        let len = this.len();
        return new Vec2(this.x/len, this.y/len);
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

//8 way directional values
const directionValues = {"n": new Vec2(0,-1), "s": new Vec2(0,1), "e": new Vec2(1,0), "w": new Vec2(-1,0)}
const direction = ["n","s","e","w"]
const directionOffset = [new Vec2(-2,-1), new Vec2(-2,0), new Vec2(0,-2), new Vec2(-1,-2)];

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
    center = () => new Vec2((this.width()/2)+this.minX, (this.height()/2)+this.minY); //center is just dem length/2 + offset;
    check(v)//take in a positonal vector or object with and x,y key
    {
        return this.minX <= v.x && this.maxX >= v.x && this.minY <= v.y && this.maxY >= v.y; //simple aabb check
    }
}