/*
* City map used to define base level algorithm for a grid focused map generation algorithm that is AABB
* Bound to compell interesting game play for a Taxi driven game, to help make navigation easy, but 
* Keep confusing and chaotic nature of city driving. System will define instance chunks, which wont be used for this simulation
* but will be useful for 3d version of the city simulation.
*/
class CityMap extends CanvasTarget
{
    /*static*/ FUNC_STEP =  //remove stat definition as its not suported by all browsers
    {
        "Init": "CreateCityCenter",
        "CreateCityCenter": "CreateStreets",
        "CreateStreets": "RefineStreets",
        "RefineStreets": "GenerateInterSections",
        "GenerateInterSections": "DefineZoning",
        "DefineZoning": "BuildBuildings",
        "BuildBuildings" : "CreateCityDecor",
        "CreateCityDecor": "Exit"
    }

    constructor()
    {
        let container = document.querySelector("article#CityMap");
        let canvas = container.querySelector("canvas");
        super(container,canvas);
        //addes canvas, container and camera to the class props list
        let over = 1;
        this.bounds = new Rect(0,0,over*canvas.width, over*canvas.height);
        this.Regenerate();
        console.log(this.funcStep);
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

        if(this.shouldRender)this.Render();// DungeonRenderer.render(this.graph, this.camera); //only render if we should render so we dont get weird rerender glitch
    }


    Init() {
        this.graph
        {
            cells: []

        }
        return true;
    }
    CreateCityCenter(){}
    CreateStreets(){}
    RefineStreets(){}
    GenerateInterSections(){}
    DefineZoning(){}
    BuildBuildings(){}
    CreateCityDecor(){}
    Exit(){}

    Render()
    {
        
    }
}

let City = new CityMap();
CanvasMgr.AddCanvas(City);
var RegenerateCityMap = () => City.Regenerate();