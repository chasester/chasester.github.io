class DungeonMap extends CanvasTarget
{
    /* static */ FUNC_STEP =  //remove stat definition as its not suported by all browsers
    {
        "Init": "CreateWelcomeRoom",
        "CreateWelcomeRoom": "GenerateRooms",
        "GenerateRooms": "Hold"
    }
    constructor()
    {
        let container = document.querySelector("article#DungeonGenerator");
        let canvas = container.querySelector("canvas");
        let props = 
        {
            "Seed Properties": [], //create a header
            "Map Seed":     [-99999,  Math.floor(Math.random()*9999), 99999],
            "Colorization Seed": [-99999,  Math.floor(Math.random()*9999), 99999],

            "Branch Properties": [], //create a header
          //  "Room Chance":     [0.0, 0.5, 1.0],
            "Decay": [1, 100, 1000],
            "Door Ways Max": [0, 2, 2],
            "Door Way Chance":  [0.0, 0.2, 1.0],
            "Direction Change Chance": [0.0, 0.1, 1.0]
        }
        super(container,canvas, props);
        //addes canvas, container and camera to the class props list
        let over = 1;
        this.bounds = new Rect(0,0,over*canvas.width, over*canvas.height);
/*         this.funcStep = "Init";
        this.graph = {map: [], cellSize: 10};
        this.dataStack = {}; */
        this.Regenerate();

    }
    Regenerate()
    {
        this.funcStep = "Init";
        this.graph = { //main stack of persistent data
            //data
            map: [], //2d array (y then x -> top right to bottom left) of Type Tile
            branches: [],  // of type branches
            room: [], //of type room

            //properties
            cellSize: 5
        };
        this.dataStack = {}; //main stack of volital data
        this.shouldRender = true;
    }
    GenerateMap()
    {
        //FUNCTION SELECTOR WHICH WILL CALL ITS SELF RECURSIVELY
        //See Canvas Manger and Canvas target relationship
        // if function returns false then map generator will move to next step
        // all data is held into the class data pool and is passed between functions
        // at the end of each cycle a delay is called to allow for the canvas to render
        // this will create a animation which will help people see how the algorithm builds
        if(this[this.funcStep]() == false)
        {
            console.log(this.funcStep)
            this.dataStack = {}; //reset data stack so we dont have collisions
            this.funcStep = this.FUNC_STEP[this.funcStep]; //stack the next step into the slot for next cycle
        }

        if(this.shouldRender) DungeonRenderer.render(this.graph, this.camera); //only render if we should render so we dont get weird rerender glitch
    }
    Init()
    {
        //animation check delay
        if(this.dataStack.nexttime) return this.dataStack.nexttime > new Date().getTime();

        this.shouldRender = true;
        DungeonRenderer.init(this.canvas);

        let colorizationSeed = new Random(this.props["Colorization Seed"][1]);
        branchrandom = new Random(this.props["Map Seed"][1]);
        console.log(`Using Seeds:\n\tMap:${branchrandom}\n\tColorization:${colorizationSeed}`);
        //build the 2d array
        let dx = Math.ceil(this.bounds.width()/this.graph.cellSize)+1;
        let dy = Math.ceil(this.bounds.height()/this.graph.cellSize)+1;
        let arr, ids = [];
        let cellSize = this.graph.cellSize;
        
        //create a random list of ids cuz we want there to be some cool colorization. Ids are unique but are randomly ordered to allow for some cool color coding
        for(let i = 0; i < dx*dy; i++) ids.push(i);
        colorizationSeed.shuffle(ids);

        //always build our arrays y then x to keep things in right up to left down
        for(let y = 0; y < dy; y++)
        {
            arr = [];
            for(let x = 0; x < dx; x++)
            { 
                arr.push(new Tile(ids.pop(), {x: x*cellSize, y: y*cellSize}, {x:x,y:y}));
            }
            this.graph.map.push(arr);
        }

        //adds delay for animation
        this.dataStack.nexttime = new Date().getTime()+200;
        return true;
    }
    CreateWelcomeRoom()
    { //keep in mind that if 3/4 of width or height is < 5 then you could have an overdraw (though in our case this wont happen)
        if(this.dataStack.nexttime) return this.dataStack.nexttime > new Date().getTime();
        let randomInt = (a,b) => Math.floor(branchrandom.randomRange(a,b)),
        size = new Vec2(this.graph.map[0].length, this.graph.map.length),
        screenIndexSize = new Vec2(this.canvas.width/this.graph.cellSize, this.canvas.height/this.graph.cellSize),
        home = new Vec2(
            randomInt(Math.floor(size.x/2) - Math.floor(screenIndexSize.x/4) ,Math.floor(size.x/2) +  Math.floor(screenIndexSize.x/4) ),
            randomInt(Math.floor(size.y/2) - Math.floor(screenIndexSize.y/4) ,Math.floor(size.y/2) +  Math.floor(screenIndexSize.y/4) )
            ),
        start = new Vec2(home.x-2, home.y-2),
        rsize = new Vec2(5,5);

        for(let y = 0, leny = rsize.y; y < leny; y++)
            for(let x = 0, lenx = rsize.x; x< lenx; x++)
                this.graph.map[start.y+y][start.x+x].type = TileTYPE.Floor;
        this.graph.map[home.y][home.x].type = TileTYPE.Entrance;
        this.graph = {...this.graph, home, size};
        
        for(let i = 0; i < 4; i++)//create our braches out of the home room
            this.graph.branches.push(new Branch(i, home.x+2*directionValues[direction[i]].x, home.y+2*directionValues[direction[i]].y, this.props["Decay"][1], branchrandom.random()*this.props["Door Way Chance"][1], branchrandom.random()*this.props["Direction Change Chance"][1], this.props["Door Ways Max"][1]));
        
        //set up camera so its where ever this spawns
        /* let minsize = this.graph.cellSize;
        this.camera.cammatix.position = new Vec2((home.x*minsize)-(this.canvas.width/2), (home.y*minsize) - (this.canvas.height/2)); */

        //wait 2000 ms before going to next step
        this.dataStack.nexttime = new Date().getTime()+400;
        return true;
    }
    GenerateRooms()
    {
        //bulk of what we will do is in this function loop
        //Key: We are gonna draw a room (near) the center of the map. This will be the player spawn room
        //We will add 4 branches allong the outsides of this room.
        //Branches will exist untill, they are removed based on a degergation, as degergation gets lower
        //the higher chance a branch is removed.
        //Each round a branch can do 1 of 4 things:
            //It draw a room if there is enough space for the size that it randomly draws(ie doesnt run into any active tiles marked as floor)
            //it can create another branch in a orthogonal direction (at 90 degrees)
            //it can roll to change directions, in an orthongal direction(at 90 degrees)
            //If all of those fall then it will move forward,
        //Each branch is ran through these things and the properties of that branch will determind its ablity or probability to do one of these 
        //keep in mind all of these steps take place in the lower level, Branch.move() and subsiquent function stack.


        //to keep this from running to fast we will set a limit
        let mintime = this.dataStack.nexttime ? this.dataStack.nexttime : new Date().getTime();
        let time = new Date().getTime();
        let b, new_b = [], remove_b = [];
        if(mintime >  time) return true; //skip frames till we get to the next frame we want to process data
        //done so we can have a slower animation

        this.dataStack.nexttime = time + 200; //run every 200 millis
        
        //simple que system

        for(let i = this.graph.branches.length; i--;) //go backwards so we can remove them in order 
        { //never add or remove branches while looping, process these after
            //console.log(i);
            b = this.graph.branches[i];
            if(b.Move(this.graph.map, new_b) == false) //if we return false we need removed
                this.graph.branches.splice(i, 1) //add to removal list
        }
        
        //birth new branches
        if(new_b.length) this.graph.branches = [...this.graph.branches, ...new_b]; //equivalent to a += b; in most other langues


        //if all branches are dead then we can move on to next step, untill then we just gonna keep on processing
        return this.graph.branches.length > 0;
    }
    Hold() //function to hold the next step (should be last step)
    {
        return true;
    }
}

{
let Dungeon = new DungeonMap()
CanvasMgr.AddCanvas(Dungeon);
var RegenerateDungeonMap = () => Dungeon.Regenerate();
}
/* 
DMContainor = document.querySelector("article#DungeonGenerator")
var Dungeon = new DungeonMap(); //first instance of class built on load of file;
var canvasDM, cameraDM;
canvasDM =  DMContainor.querySelector("canvas");

if(DMContainor)
    setInterval(function () {
        if(DMContainor.className === "active" && canvasDM)
        {
            if(!cameraDM) cameraDM = new Camera(canvasDM);
            Dungeon.GenerateMap(canvasDM);
        }
        else{
            if(cameraDM){ cameraDM.deactivate(); cameraDM = null; } //remove listeners
        }
}, 150);
else
    console.error("could not mount canvasDM to dom, this could be due to browser incompatiblity");
 */