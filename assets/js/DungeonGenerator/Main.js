class DungeonMap extends CanvasTarget
{
    static FUNC_STEP = 
    {
        "Init": "Hold"
    }
    constructor()
    {
        let container = document.querySelector("article#DungeonGenerator");
        let canvas = container.querySelector("canvas");
        super(container,canvas);
        //addes canvas, container and camera to the class props list
        this.bounds = new Rect(0,0,canvas.width, canvas.height);
        this.funcStep = "Init";
        this.graph = {map: [], cellSize: 10};
    }
    Regenerate()
    {
        this.funcStep = "Init";
        this.graph = {map: [], cellSize: 10};
        this.dataStack = {};
        this.shouldRender = true;
    }
    GenerateMap()
    {
        //FUNCTION SELECTOR WHICH WILL CALL ITS SELF RECURSIVELY
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
        this.shouldRender = true;
        DungeonRenderer.init(this.canvas);
        //build the 2d array
        let dx = Math.ceil(this.bounds.width()/this.graph.cellSize)+1;
        let dy = Math.ceil(this.bounds.height()/this.graph.cellSize)+1;
        let arr, ids = [];
        for(let i = 0; i < dx*dy; i++) ids.push(i);
        random.shuffle(ids);
        //always build our arrays y then x to keep things in right up to left down
        for(let y = 0; y < dy; y++)
        {
            arr = [];
            for(let x = 0; x < dx; x++)
            { 
                arr.push({id: ids.pop(), x: x, y: y});
            }
            this.graph.map.push(arr);
        }
        return false;
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