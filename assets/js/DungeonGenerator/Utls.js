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