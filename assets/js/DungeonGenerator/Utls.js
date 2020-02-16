class Tile
{
    static TYPE =
    {
        "None": 0,
        "Wall": 1,
        "Floor": 2,
        "Entrance": 3,
        "Exit": 4
    }
    constructor(id, pos, ind, type=0)
    {
        this.id = id;
        this.type = type;
        this.position = new Vec2(pos.x, pos.y); //world position
        this.indPosition = new Vec2(ind.x, ind.y); //position in the world array
    }
}

class Room //original alogoithm didnt use this, so this maybe added to code if i expand into a more extragant example
{
    constructor(id,tid,name,x,y, sizex, sizey)
    {
        this.id = id;
        this.tileid = tid;
        this.name = name;
        this.bounds = new Rect(x,y,x+sizex, y+sizey);
    }
}


//old code 0 is wall and 1 is floor 
//our code 0 is wall and 2 is floor, wall is a post effect
class Branch
{
    static Random = new Random(Math.random()); //set up a global random just so we can do seeding later
    constructor(direction, x,y, decay, b_chance, dir_chance)
    {
        //decay - chance for branch to die
        //chance - chance for creating a new branch
        //dir is the last direction traveled from;
        //room is the last room visited
        this.dir = direction;
        this.location = new Vec2(x,y);
        this.decay = decay;
        this.room_exit = 0;
        this.b_chance = b_chance;
        this.dir_chance = dir_chance;
        this.room = None;
        this.room_step = -5;
    }

    TryBranch() //should we branch off
    {
        b = Branch.Random.random() > this.b_chance;
        this.b_chance += b ? -0.01 : 0.5;
        return b;
    }
    CreateRoom(world, branches,canBranch=true, force =false) //should we try and draw a room
    {
        if(Branch.Random.random() > 0.2 && force == false) //decide not to draw room
        {world[this.location.y][this.location.x] = 1; return true}

        this.room_step = -2; //reset this so we dont draw a room too often
        let randomInt = (a,b) => Math.floor(Branch.Random.randomRange(a,b));
            rsize = new Vector2(randomInt(3,6), randomInt(3,6)),
            rdir = directionOffset[this.dir];
            rstart = new Vec2(
                (rdir.x == -2 ? -randomInt(0,rsize.x-1) : rdir.x*rsize.x + (this.dir == 2 ? 1 : 0)) + this.location.x,
                (rdir.y == -2 ? -randomInt(0,rsize.y-1) : rdir.y*rsize.y + (this.dir == 1 ? 1 : 0)) + this.location.y,
            ), //upper left location offset + location + one more move tile (for padding)
            flag = false, t;
        if(rstart.x < 0 || rstart.y < 0 || rstart.y >= world.length || rstart.y >= world[0].length)
            return this.draw_back(world); //to close to the edge of the map
        try //wrap it in this so we can easy break
        {
            for(let y =-1, len = rsize.y+1; y < len; y++)
            {
                for(let x = -1, len = rsize.x+1; x < len; x++)
                {
                    t = world[rstart.y+y][rstart.x+x];
                    if(t.type == Tile.TYPE.Floor) //t.type will error if t is undefined 
                    {
                        world[this.location.y][this.location.x] = 1;
                    }
                }
            }
        } catch { return this.draw_back(world);} //to close to the end of the map to draw
        
        if(flag) //we ran into another path or we are over the edge of the map so we need to just keep moving
            {world[this.location.y][this.location.x] = 1; return true;} 

        //we didnt run into another branch or room so we can draw now
        for(let y = 0, len = rsize.y; y < len; y++ )
            for(let x =0, len = rsize.x; x < len; x++ )
                world[rstart.y+y][rstart.x + x] = 1;
    
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor; //assign the tile the branch is on (this is one unit from the room)
        this.location = directionValues[direction[this.dir]].add(this.location); //move into the room to one tile pass the entrence
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor; //redunent?
        this.location = this.location + (rsize-1)*directionValues[direction[this.dir]]; //move to the other end of the room -stright accross

        //now determind a tangental exit at a random othogonal height (while staying in the room bounds)
        if(this.dir > 1) //orthoganal is y axis
            this.location.y = rstart.y + randomInt(0,rsize.y);
        else //orthonganal is x axis
            this.location.x = rstart.x + randomInt(0,rsize.x);
        
        if(!canBranch)
            return false;
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor;
        //if(!this.TryBranch()) return true; //try to make alternet exits in this room
        
        let b = this.dir < 2 ? 2 : 0,
            loc, dir;

        for(let i = b, len = b+2; i < len; i++)
        { //create a branch in both orthonganal directions ie new exits to this room (so each room has 2 - 4 exits)
            if(!this.TryBranch()) continue;
            loc = new vec2(rstart.x, rstart.y);
            switch(i)
            {
                case 0:
                    loc.x += randomInt(0,r_size.x-1);
                break;
                case 1:
                    loc.x += randomInt(0,r_size.x-1);
                    loc.y += rsize.y-1;
                break;
                case 2:
                    loc.y += randomInt(0,r_size.y-1);
                    loc.x += rsize.x-1;
                break;
                case 3:
                    loc.y += randomInt(0,r_size.y-1);
                break;
            }
            dir = directionValues[direction[i]];
            brn = branch(i,loc.x, loc.y, randomInt(100,200), Branch.Random.random()*0.1, Branch.Random.random()*0.2);
            branches.push(brn);
        }
        return true;
    }
    ChangeDirection()
    {
        let randomInt = (a,b) => Math.floor(Branch.Random.randomRange(a,b));
        if(this.dir == 0 || this.dir == 1) return Branch.Random.random() > 0.5 ? 2 : 3;
        if(this.dir == 2 || this.dir == 3) return Branch.Random.random() > 0.5 ? 0 : 1;
        return this.dir;
    }

}