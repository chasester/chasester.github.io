//Main loop for the RanomMap generator
//This is responsible for most of the logic and calling the renderer inbtween intervles


class RandomMap
{
    constructor()
    {
        this.graph = new Voronoi(); //external library class
        this.corners = []; //list of internal corners
        this.cells = []; //list of internal cells
        this.sites = []; //list of internal vec2 points randomly picked from seed
        this.edges = []  //list of internal edges

        this.stepid = 0; //allows for recusvie calling so we can create a sudo animation cycle

        this.props =  // list of props given to the user, set to default (obviously);
        {//min default max
            
        }

        init();
    }
    init(){ //start function for building base map on load
        this.GenerateMap();
    }
    
    GenerateMap()
    {

    }
}

var Map = new RandomMap(); //first instance of class built on load of file; forces generation