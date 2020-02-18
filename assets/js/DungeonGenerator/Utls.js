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
        this.dorment = false;
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
var seed = Math.random()*9999999;
class Branch
{
    static Random = new Random(seed); //set up a global random just so we can do seeding later
    constructor(direction, x,y, decay, b_chance, dir_chance)
    {
        console.log(seed);
        //decay - chance for branch to die
        //chance - chance for creating a new branch
        //dir is the last direction traveled from;
        //room is the last room visited
        this.id = Branch.Random.random()*999999999;
        this.dir = direction;
        this.location = new Vec2(x,y);
        this.decay = decay;
        this.room_exit = 0;
        this.b_chance = b_chance;
        this.dir_chance = dir_chance;
        this.room = null;
        this.room_step = -5;
    }

    TryBranch() //should we branch off
    {
        let b = Branch.Random.random() > this.b_chance;
        this.b_chance += b ? -0.01 : 0.05;
        return b;
    }
    CreateRoom(world, branches,canBranch=true, force =false) //should we try and draw a room
    {
        if(Branch.Random.random() > 0.8 && force == false) //decide not to draw room
        {world[this.location.y][this.location.x].type = Tile.TYPE.Floor; return true}
        

        this.room_step = -2; //reset this so we dont draw a room too often
        let randomInt = (a,b) => Math.floor(Branch.Random.randomRange(a,b)),
            rsize = new Vec2(randomInt(3,6), randomInt(3,6)),
            rdir = directionOffset[this.dir],
            rstart = new Vec2(
                (rdir.x == -2 ? -randomInt(0,rsize.x-1) : rdir.x*rsize.x + (this.dir == 2 ? 1 : 0)) + this.location.x,
                (rdir.y == -2 ? -randomInt(0,rsize.y-1) : rdir.y*rsize.y + (this.dir == 1 ? 1 : 0)) + this.location.y,
            ), //upper left location offset + location + one more move tile (for padding)
            flag = false, t;
        if(rstart.x < 0 || rstart.y < 0 || rstart.y >= world.length || rstart.y >= world[0].length)
            { return this.draw_back(world);} //to close to the edge of the map}
        try //wrap it in this so we can easy break
        {
            for(let y =-1, leny = rsize.y+1; y < leny; y++)
            {
                for(let x = -1, lenx = rsize.x+1; x < lenx; x++)
                {
                    t = world[rstart.y+y][rstart.x+x];
                    if(t.type == Tile.TYPE.Floor) //t.type will error if t is undefined 
                    {
                        flag = true;
                        break;
                    }
                }
                if(flag) break;
            }
        } catch { return this.draw_back(world);} //to close to the end of the map to draw
        
        if(flag) //we ran into another path or we are over the edge of the map so we need to just keep moving
            {world[this.location.y][this.location.x].type = Tile.TYPE.Floor; return true;} 

        //we didnt run into another branch or room so we can draw now
        for(let y = 0, leny = rsize.y; y < leny; y++ )
            for(let x =0, lenx = rsize.x; x < lenx; x++ )
                world[rstart.y+y][rstart.x + x].type = Tile.TYPE.Floor;
    
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor; //assign the tile the branch is on (this is one unit from the room)
        this.location = directionValues[direction[this.dir]].add(this.location); //move into the room to one tile pass the entrence
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor; //redunent?
        //this.location = this.location.add(directionValues[direction[this.dir]].mul(rsize.sub(1).x, rsize.sub(1).y)); //move to the other end of the room -stright accross
        this.location.x += directionValues[direction[this.dir]].x*(rsize.x-1);
        this.location.y += directionValues[direction[this.dir]].y*(rsize.y-1);

        //now determind a tangental exit at a random othogonal height (while staying in the room bounds)
        if(this.dir > 1) //orthoganal is y axis
            this.location.y = rstart.y + randomInt(0,rsize.y);
        else //orthonganal is x axis
            this.location.x = rstart.x + randomInt(0,rsize.x);
        
        if(!canBranch){ return false;}
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor;
        if(!this.TryBranch()) {return true;} //try to make alternet exits in this room
        let b = this.dir < 2 ? 2 : 0,
            loc, dir;

        for(let i = b, len = b+2; i < len; i++)
        { //create a branch in both orthonganal directions ie new exits to this room (so each room has 2 - 4 exits)
            if(!this.TryBranch()) continue;
            loc = new Vec2(rstart.x, rstart.y);
            switch(i)
            {
                case 0:
                    loc.x += randomInt(0,rsize.x-1);
                break;
                case 1:
                    loc.x += randomInt(0,rsize.x-1);
                    loc.y += rsize.y-1;
                break;
                case 2:
                    loc.y += randomInt(0,rsize.y-1);
                    loc.x += rsize.x-1;
                break;
                case 3:
                    loc.y += randomInt(0,rsize.y-1);
                break;
            }
            dir = directionValues[direction[i]];
            let brn = new Branch(i,loc.x, loc.y, randomInt(100,200), Branch.Random.random()*0.1, Branch.Random.random()*0.2);
            branches.push(brn);
        }
        return true;
    }
    ChangeDirection()
    {
        //let randomInt = (a,b) => Math.floor(Branch.Random.randomRange(a,b));
        if(this.dir == 0 || this.dir == 1) return Branch.Random.random() > 0.5 ? 2 : 3;
        if(this.dir == 2 || this.dir == 3) return Branch.Random.random() > 0.5 ? 0 : 1;
        return this.dir;
    }
    draw_back(world)
    {
        //reverse my direction
        let dir = {...directionValues[direction[this.dir]]};
        dir.x *= -1; dir.y *= -1;

        let count, i_loc, loc, t;
        this.location.x = Math.min(Math.max(this.location.x, 0), world[0].length-1);
        this.location.y = Math.min(Math.max(this.location.y, 0), world.length-1);
        
        //for(let i = 0, len = Math.max(world.length, world[0].length)+1; i < len; i++) //safe way to do it but whats the fun in that
        while (true)
        {
            count = 0;
            i_loc = null;
            for(let i = 0; i < 4; i++) //go through 4 cardinal directions
            {
                try {
                loc = this.location.add(directionValues[direction[i]]);
                t = world[loc.y][loc.x];
                if(t && t.type == Tile.TYPE.Floor) { count += 1; i_loc = loc;} //if we find a floor tile then set its location and then add count\
                }catch{}
            }
            if(count > 1) break; //we have 2 tiles that are floor we are back in a room so we can stop
            //else fill in the last tile we where at and move us to the open tile near us
            try{
            t = world[this.location.y][this.location.x];
            if(t) t.type = Tile.TYPE.None;
            if(i_loc == null) { break;} //this should nv happen unless some weird corner case i cant think of rn
            this.location = i_loc;
            }catch{break;}
        }
        return false;
    }
    Move(world, branches) //main loop
    {
        if(this.dorment) return false;
        let random = () => Branch.Random.random();
        this.decay -= 1;
        this.location = this.location.add(directionValues[direction[this.dir]])
        if(this.decay < 10)
        {
            if(random()*10 - this.decay > 0)
            {
                this.CreateRoom(world, branches,false,true);
                return self.draw_back(world);
            }
        }
        let change = false;
        if(this.dir_chance > random())
        {
            this.dir = this.ChangeDirection();
            change = true;
        }
        
        try{
        let t;
        t = world[this.location.y][this.location.x];
        if(t.type == Tile.TYPE.Floor) {return false;};
        
        //if(!t)return this.draw_back(world); //ran out of the map
        if(t.type == Tile.TYPE.Floor) return false; //ran into another branch
        try{ //now we need to check if there is a room near us so we dont get wierd room cuts that make odd shapes. Basically check a one space margin to make sure we arent running along a room
            if(this.dir > 1 && change == false)
            { //this is nor perfect as this can cause some weird corner rooms on the edges but these are not very odd so we will accept them
                for(let y = -1; y < 2; y+=2) //check n s
                    if(world[this.location.y + y][this.location.x].type == Tile.TYPE.Floor)
                    {
                        world[this.location.y][this.location.x].type = Tile.TYPE.Floor;
                        return false; //kill brach
                    }
            }else if(change == false) 
            {
                for(let x = -1; x < 2; x+=2) //check e w
                    if(world[this.location.y][this.location.x + x].type == Tile.TYPE.Floor)
                    {
                        world[this.location.y][this.location.x].type = Tile.TYPE.Floor;
                        return false; //kil branch
                    }
            }
        } catch {return this.draw_back;} //we are 1 tile from the edge of the map so lets delete cuz we arent gonna be able to make any more rooms (unless we change in the one direction which is unlikely)
        
        //if change == true then we always go here
        this.room_step += 1
        if(this.room_step > 0) //force a room as much as posible so we can make sure we have lots of rooms
            return this.CreateRoom(world, branches);
        world[this.location.y][this.location.x].type = Tile.TYPE.Floor;;
        return true;
        }catch {return this.draw_back(world);}
    }
}