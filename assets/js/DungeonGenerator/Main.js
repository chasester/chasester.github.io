class DungeonMap
{
    static FUNC_STEP = 
    {
    }
    constructor()
    {
        this.funcStep = "Init";
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
            this.funcStep = RandomMap.STEP_FUNC[this.funcStep]; //stack the next step into the slot for next cycle
        }

        if(this.shouldRender) RandomMapRender.render(this.graph, camera); //only render if we should render so we dont get weird rerender glitch
    }
    Init()
    {
        console.log("init");
        return true;
    }
}



DMContainor = document.querySelector("article#DungeonGenerator")
var Dungeon = new DungeonMap(); //first instance of class built on load of file;
var RegenerateDungeonMap = () => Dungeon = new DungeonMap();
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
