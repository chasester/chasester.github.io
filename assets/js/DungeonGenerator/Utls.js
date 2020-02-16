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


