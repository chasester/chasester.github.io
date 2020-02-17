class DungeonMap extends CanvasTarget
{
    static FUNC_STEP = 
    {
        "Init": "CreateWelcomeRoom",
        "CreateWelcomeRoom": "GenerateRooms",
        "GenerateRooms": "Hold"
    }
    constructor()
    {
        let container = document.querySelector("article#DungeonGenerator");
        let canvas = container.querySelector("canvas");
        super(container,canvas);
        //addes canvas, container and camera to the class props list
        this.bounds = new Rect(0,0,canvas.width, canvas.height);
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
            cellSize: 20
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
            this.funcStep = DungeonMap.FUNC_STEP[this.funcStep]; //stack the next step into the slot for next cycle
        }

        if(this.shouldRender) DungeonRenderer.render(this.graph, this.camera); //only render if we should render so we dont get weird rerender glitch
    }
    Init()
    {
        //animation check delay
        if(this.dataStack.nexttime) return this.dataStack.nexttime > new Date().getTime();

        this.shouldRender = true;
        DungeonRenderer.init(this.canvas);
        //build the 2d array
        let dx = Math.ceil(this.bounds.width()/this.graph.cellSize)+1;
        let dy = Math.ceil(this.bounds.height()/this.graph.cellSize)+1;
        let arr, ids = [];
        let cellSize = this.graph.cellSize;

        //create a random list of ids cuz we want there to be some cool colorization. Ids are unique but are randomly ordered to allow for some cool color coding
        for(let i = 0; i < dx*dy; i++) ids.push(i);
        random.shuffle(ids);

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
        this.dataStack.nexttime = new Date().getTime()+1000;
        return true;
    }
    CreateWelcomeRoom()
    { //keep in mind that if 3/4 of width or height is < 5 then you could have an overdraw (though in our case this wont happen)
        if(this.dataStack.nexttime) return this.dataStack.nexttime > new Date().getTime();
        let randomInt = (a,b) => Math.floor(Branch.Random.randomRange(a,b)),
        size = new Vec2(this.graph.map[0].length, this.graph.map.length),
        home = new Vec2(
            randomInt(Math.floor(size.x/4), Math.floor(3*size.x/4)), 
            randomInt(Math.floor(size.y/4), Math.floor(3*size.y/4))
            ),
        start = new Vec2(home.x-2, home.y-2),
        rsize = new Vec2(5,5);
        console.log(this.graph.map[start.y][start.x]);
        for(let y = 0, leny = rsize.y; y < leny; y++)
            for(let x = 0, lenx = rsize.x; x< lenx; x++)
                this.graph.map[start.y+y][start.x+x].type = Tile.TYPE.Floor;
        this.graph.map[home.y][home.x].type = Tile.TYPE.Entrance;
        this.graph = {...this.graph, home, size};
        
        for(let i = 0; i < 4; i++)//create our braches out of the home room
            this.graph.branches.push(new Branch(i, home.x+2*directionValues[direction[i]].x, home.y+2*directionValues[direction[i]].y, 100,0, Branch.Random.random()));
        
        //wait 2000 ms before going to next step
        this.dataStack.nexttime = new Date().getTime()+1000;
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

        this.dataStack.nexttime = time + 2000; //run every 200 millis
        
        //simple que system

        for(let i = this.graph.branches.length; i--;) //go backwards so we can remove them in order using a simple while statement
        { //never add or remove branches while looping, process these after
            b = this.graph.branches[i];
            if(b.Move(this.graph.map, new_b)) //if we return false we need removed
                remove_b.push(i); //add to removal list
        }
        
        //remove dead branches
        //only works if we remove back to front, but since we started from the back these will only be in that order
        while(remove_b.length) this.graph.branches.splice(remove_b.pop(), 1);

        //birth new branches
        if(new_b.length) this.graph.branches = [...this.graph.branches, ...new_b]; //equivalent to a += b; in most other langues


        //if all branches are dead then we can move on to next step, untill then we just gonna keep on processing
        return this.graph.branches.length > 0;
    }
    Hold() //function to hold the next step (should be last step)
    {
        //console.log(this.graph.map);
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