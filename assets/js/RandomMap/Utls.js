//Holds all basic utiltiy constants and data structures


/*
    List of a few Difinitive constants that need to be stated here about how we are going to use
    and defined principles of voronoi graphs:

     *Edges are always owned by 2 cells (border edges are own by 2 in which one is fake)
        and the edge is placed between to bording cells in which a line can be drawn 
        between 2 sites (centers of cells) with out crossing another cells edge.
        Edges are placed on this line exactly in the middle between these two sites
    *Corners are owned by no more than 2 edges and describe a verticie in the N-gon formed
        by the Cell. Both the edge knows its cell and edge and the said classes know about it.
    *Cell is a collection of N edges (3-9 normally) in which it creates a completed shape (of N sides
        with convex shape properties). The center of any cell is called a Site, this is a random
        point that was givin to the voronoi graph to process. This represents the exact center of the shape
        after loyds relaxation irrations (in theory) but we want inconsistent centers so we will not 
        full relax these so they may or may not be perfectly in the middle.
    *Mid point is a point that sits on the line defined by an edge exactly in the middle and represents
        The exact point in the middle of 2 neighboring cells.
*/

//represents one N gon shape (between 3-9 sided) which contains a list of corners and edges
//this cell will hold the meta data for the biome this cell is configured to be.
class Cell
{
    constructor(position, index) //position is either an object {x,y} or vec2 and index is a unique id
    {
        this.center = new Vec2(position.x, position.y);
        this.borders = []; //this is will be of type edges
        this.corners = []; //this will be of type corners
        this.neighbors = [] //this will be of type cell
        this.id = index; // a unique id to help identify this cel
        this.biome = 0;
    }
    RemoveNeighbors()
    {
        this.neighbors.forEach(x => x.RemoveCell(this));
        this.neighbors = [];
    }
    RemoveCell(C) //C is of type cell;
    {
        this.neighbors.RemoveCell(C);
        disown();
    }
    IsEdgeCell(bounds, clamp = false) // bounds is the map bounds of type rect clamp is of type bool
    {
        let radius = 0;
        let en = [];
        if(bounds.maxX -1 - bounds.width()*0.01 <= this.center.x || (bounds.minx + bounds.width()*0.01) >= this.center.x ||
            (bounds.maxY-1 - bounds.height()* 0.01) <= this.center.y || (bounds.minY + bounds.height()) >= this.center.y)
                clamp = false;
        for(let i = 0; i < this.borders.length; i++)
        {
            if(this.borders[i].IsEdge(bounds))
            {
                if(!clamp) return true; //breaks;
                if(radius == 0) this.neighbors.forEach(y => {radius = Math.max(this.position.dist(y.position), radius)});
                en = this.borders[i].ClampEdge(bounds,this.center,radius);
                en.forEach(y => this.neighbors.push(new Cell(y, -1))) //add in false neighbors to balence everything and keep from having wierd rendering bugs
            }
        }
        return false;
    }
    AddEdge(edge, neighbor) // edge is of type edge and is the edge that wishes to be added, neighbor is the Cell lengther to this edge
    {
        this.neighbors.push(neighbor);
        //debuging code if we see some interesting double line errors
        //for (int i = 0; i < this.borders.length; i++) if (this.borders[i].isequal(edge)) return false; //so we dont add the same edge twice (idk how we could);
        this.borders.push(edge);
        let cr = edge.ends; //be carefull here cuz we have no protection here
        let flag = false;
        for(let i = 0; i < 2; i++)
        {
            for(let j = 0; j < this.corners.length; j++)
                if(this.corners[j].position.x == cr[i].position.x && this.corners[j].position.y == cr[i].position.y) //no opp overload so this is just corner1 == corner2 or corner position == corner2 position
                    flag = true;
            if(!flag) this.corners.push(cr[i]);
            flag = flag;
        }
        return true;
    }
    disown() //destroy cell and update references
    {
        //todo: maybe add a way to remove one cell from the list then rebuild that part of the list. for now you will just remove that point from the list and then rebuild the entire graph
        this.neighbors = [];
        this.borders.forEach(x=> x.disown());
        this.borders = [];
    }
    isEqual(c)
    {
        return this.center.equalTo(c.center);
    }
}

class Edge
{
    //f1 and t1 are vectors describing the verticies in f1 to t1 indicie order.
    //c1 and c2 are the cells which this edge is owned by (ie this edge is the border between cell1 site and cell2 site) see main description
    //is the index of this edge (in the global edge list ie a unique id)
    //corners are a list of all corners that currently exist
    constructor(f1,t1, c1,c2,index,corners) 
    {
        this.c1 = c1;
        this.c2 = c2;
        this.neighbors = []; //of edges;
        this.m = new Midpoint(this, new Vec2(t1.x, t1.y).lerp(f1, 0.5)); //create a mid point
        this.ends = new Array(2);
        this.id = index;
        this.riverLevel = 0.0;
        this.tempature = 0.0;

        let e, t2, f2; //keep in mind these are unprotected
        let borders = [...c1.borders, ...c2.borders]; //is protected

        //handles corners if they are already defined
        for(let i = 0; i < borders.length; i++)
        {
            //set up each edge with are new aliases;
            e = borders[i]; t2 = e.getTo(); f2 = e.getFrom();
            if(this.ends[0] == undefined) //keep in mind that undefined is null in most other languages in this case
            { //only run this one time after a true is fired
                if(new Vec2(t1.x, t1.y).equalTo(t2))      {this.ends[0] = e.ends[0]; this.ends[0].AddEdge(this); continue;}
                else if(new Vec2(t1.x, t1.y).equalTo(f2)) {this.ends[0] = e.ends[1]; this.ends[0].AddEdge(this); continue;}
            }
            if(this.ends[1] == undefined)
            {
                if(new Vec2(f1.x, f1.y).equalTo(t2))      {this.ends[1] = e.ends[0]; this.ends[1].AddEdge(this); continue;}
                else if(new Vec2(f1.x, f1.y).equalTo(f2)) {this.ends[1] = e.ends[1]; this.ends[1].AddEdge(this); continue;}
            }
            if(this.ends[0] != undefined && this.ends[1] !== undefined){break;} //we found a corner for both ends so we are done;
        }

        //handle corners if not already defined
        if(this.ends[0] == undefined){ this.ends[0] = new Corner(t1,corners.length, this); corners.push(this.ends[0]); }
        if(this.ends[1] == undefined){ this.ends[1] = new Corner(f1, corners.length,this); corners.push(this.ends[1]);}

        //handle cells
        c1.AddEdge(this,c2); c2.AddEdge(this,c1);
    }

    IsEdge(bounds) //type Rect, represets the bounds of the map, returns if edges end or start is on the edge of the bounds
    {
        if(ends[0] == undefined || ends[1] == undefined) return false;
        let to = ends[0].position, from = ends[1].position;
        if(bounds.minX >= to.x || bounds.minX >= from.x || bounds.maxX - 1 <= to.x || bounds.maxX -1 <= from.x ||
           bounds.minY >= to.y || bounds.minY >= from.y || bounds.maxY - 1 <= to.y || bounds.maxY -1 <= from.y) //do we fall on or outside the aabb
            return true; //if
        return false; //else
    }

    getTo()  { return this.ends[0] != undefined ? this.ends[0].position : new Vec2(0,0);}
    getFrom(){ return this.ends[1] != undefined ? this.ends[1].position : new Vec2(0,0);}
    getCells() { return [this.c1,this.c2]} //returns these as an array to make processing them easier

    ClampEdge(bounds, center, radius) //bounds type rect center type vec2 radius type number;
    {
        let ps = [];
        radius *= 0.5; // so we dont over pull objects to the edge. 
        
        //do to vector
        if(this.ends[0] == undefined || this.ends[1] == undefined) return null;
        let to = this.ends[0].position, from = this.ends[1].position;
        if      (bounds.minX >= to.x)       for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x - radius, center.y + radius * i));
        else if (bounds.maxX - 1 <= to.x)   for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius, center.y + radius * i));
        else if (bounds.minY >= to.y)       for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius * i, center.y - radius));
        else if (bounds.maxY - 1 <= to.y)   for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius * i, center.y + radius));

        //check from vector
        if      (bounds.minX >= from.x)     for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x - radius, center.y + radius * i));
        else if (bounds.maxX - 1 <= from.x) for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius, center.y + radius * i));
        else if (bounds.minY >= from.y)     for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius * i, center.y - radius));
        else if (bounds.maxY - 1 <= from.y) for (let i = -1; i < 2; i += 2) ps.push(new Vec2(center.x + radius * i, center.y + radius));

        return ps;
    }
    calculatemidpoint(to, from) //both type of vector2
    {
            return  //learping is an weighted average based on paramater 2 so 0.5 gives you the middle between 2 points;
    }
    disown()
    {
        for (let i = 0; i < 2; i++) { if (this.ends[i] != undefined) this.ends[i].Disown(); this.ends[i] = undefined; }
        this.m = null;
    }
    isEqual(e)
    {
        if(e.getTo().isEqual(this.getTo()) && e.getFrom().isEqual(this.getFrom()))
            return true;
        if(e.getTo().isEqual(this.getFrom()) && e.getFrom().isEqual(this.getTo()))
            return true;
        return false;//else
    }
}

class Midpoint //unused but still track for future use
{
    constructor(edge,position)
    {
        this.e = edge;
        this. position;
    }
}

TerrainType = //basically an enum object because we dont have enums
{
    NONE: 0,
    OCEAN: 1,
    COAST: 2,
    LAND: 3,
    LAKE: 4

}

class Corner
{
    constructor(point, index, e) //point is type vec2, index is a unique id, e is of type edge which spawned this corner
    {
        this.elevation = 0.0;
        this.moisture = 0.0;
        this.tempature = 0.0;

        this.terrainType = TerrainType.None;
        this.id = index;
        this.position = point;
        this.edges = [];   //edges
        this.neighbors = []; //corners
        this.touches = [];  //Cells

        this.AddEdge(e); //adds edge to edges array
    }

    AddEdge(e) //type edge
    {
        this.edges.push(e);
        let cells = e.getCells();
        let flag = false;
        for (let j = 0; j < 2; j++)
        {
            for (let i = 0; i < this.touches.length; i++)
                if (this.touches[i].isEqual(cells[j])) { flag = true; break; }
            if(!flag)this.touches.push(cells[j]);
            flag = false;
        }
        return this;
    }
    GatherNeighbors() //looks out and finds nieghbors
    {
        for (let j = 0; j < this.edges.length; j++)
        {
            let c = this.edges[j].ends;
            for (let i = 0; i < 2; i++)
            {
                if (c[i] == null) continue; //is map edge
                if (c[i].isEqual(this)) continue;  //is me
                this.neighbors.push(c[i]); //else its some one else so add
            }
        }
    }
    SetTerrianProperties(elv, moist, type)
    {
        this.elevation = elv;
        this.moisture = moist;
        this.terrainType = type;
    }

    GetEdgeIdFromCorners(c) //this corner and c define only one edge this edge id is what is returned
    {
        cn = []; //of corners;
        for (let i = 0; i < this.edges.length; i++)
        {
            cn = this.edges[i].GetCorners();
            for (let k = 0; k < 2; k++)
                if (cn[k].isEqual(c)) return this.edges[i].id;
        }
        //else we didnt find one so return null
        return -1;
    }
    IsBoundary(bounds)
    {
        if (bounds.minX >= this.position.x || bounds.minY >= this.position.y || 
            bounds.maxX - 1 <= this.position.x || bounds.maxY-1 <= this.position.y) 
                return true; //if
        return false; //else
    }
    disown()
    {
        this.neighbors = [];
        this.touches = [];
        this.edges = [];
    }

    HasTerrianValue()
    {
        return this.terrainType != TerrainType.NONE;
    }
    isEqual(c)
    {
        return this.position.x == c.position.x && this.position.y == c.position.y;
        
    }
}

IslandProperty =
{
    elevation: 0.0,
    moisture: 0.0,
    landChance: 0.0
}

class Highpoint
{
    //x,y,sizex,sizey describe an aabb in which this high point influences where x,y is the middle, 
    //elevation describes the highest point (from center) 
    //dispation describes the rate of change from the center represented as a power function 
    //so elev - (dist/size)^dispat where dist is the distance from a said point to the center in a
    //single demention. This is accumlitive so any values less than 0 will not effect
    //This creates an elpisode shape of 2d slope at the rate of dispation, where size is the over all 
    //effectable area
    constructor(x,y,sizex,sizey, elev, dispat)
    {
        this.position = new Vec2(x,y);
        this.size = new Vec2(sizex, sizey);
        this.elevation = Math.min(Math.max(elev,0.0), 1.0); //clamping between 0 to 1
        this.dispation = dispat;
    }
}