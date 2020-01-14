//Main loop for the RanomMap generator
//This is responsible for most of the logic and calling the renderer inbtween intervles


var STEP_FUNC = //string function types which allow us to to do dynamic step calling
{
    "Init": "GenerateSites", //init only runs on the first pass
    "GenerateSites": "CreateVoronoi",
    "CreateVoronoi": "RelaxVoronoi",
    "RelaxVoronoi": "HeightGeneration",
    "HeightGeneration": "LandBuilding",
    "LandBuilding": "CoastalCleanup",
    "CoastalCleanup": "TerrianNormalization",
    "TerrianNormalization": "TempatureRoughCover",
    "TempatureRoughCover": "WaterSheding",
    "WaterSheding": "GenerateSites"   
}

class RandomMap
{
    constructor()
    {
        this.graph = new Voronoi(); //external library class
        this.corners = []; //list of internal corners
        this.cells = []; //list of internal cells
        this.sites = []; //list of internal vec2 points randomly picked from seed
        this.edges = []  //list of internal edges

        this.funcStep = "Init"; //start with an init function;
        this.isRunning = false; // allow to recycle to next step or should we stop recursively calling
        this.stepId = 0; //id 0 means that we are starting from the begining of the cycles
        this.graph = new Voronoi();
        this.status = "Ready";
        this.bounds = new Rect(0,0,1,1); //dont set up bounds until we get a canvas
        this.props =  // list of props given to the user, set to default (obviously);
        {//min default max

            "Seed Properties": [], //create a header
            "Seed":     [-99999, 0, 99999],
            "Variant":  [-99999, 0, 99999],
            "Map Seed": [-99999, 0, 99999],

            "Map Properties": [], //create a header
            "Water Height": [0.0001, 0.3, 1.0],
            "Perlin Weight": [0.0, 0.32, 1.0], //set this slightly above sea level so we get some islands randomly sprinkled
            "Center Weight": [0.0, 0.68, 1.0], //this and the above must equal 1.0 Done this way so you can add more methods as weights
            "Coast Clean Irrations": [1,5,20],
            "Cell Percentage": [0.0001, 3.0, 15],
            "Min Distance": [0.00001, 5, 10],
            "CoastalRoughness": [0.0001, 1.0, 5.0],
            "Normalizations Cycles": [-1, 3, 5],
            "Lake Moisture": [0.0, 0.8, 1.0],
            "Moisture Threshold": [0.000001, 0.01, 0.2],
            "Rain Fall Average": [0.0, 4.0, 10.0],

            "Voronoi Properties": [],
            "LLOYD Irrations": [0, 2, 5],
            "PATEL Irrations": [0, 4, 10],

            "Heigh Point Properties": [],
            "Number of High Points": [1,3],
            "X Range": [500, 2500],
            "Y Range": [500, 2500],
            "Elevation Range": [0.6, 1.0],
            "Elevation Dropoff": [0.8, 1.8]
        }

        //this.init();
    }
    Setproperty(name, value)
    {
        //some heavy validation due to this being a outfacing function to the user
        let prop = this.props[name]; //hold the prop here
        //global validation
        if(prop === undefined || prop.length ) //dont allow new properties to exist
            {console.error("This property does not exist"); return;}
        
        //handle min/max/value style properties
        if(typeof value != "Array") { 
            value = parseFloat(value);
            props[1] = Math.min(Math.max(value, prop[0]),prop[2]); //clamp to the defined min/max
            return; //escape here
        }
        //else
        //handle range values sets
        if(prop.length && prop.length > value.length) // make sure that value has same length. Keep in mind props.length means that it is defined. Do to some objects being of type Array
            {console.error("Length does not match correct value length. Make sure you have a correctly formated Array"); return;}
        value.length = prop.length; // make sure to chop array to the correct size;
        value = value.map(x=> parseFloat(x)); //make sure to format all of these as float types ;
        prop = value; //once we done we can finalize it
        return;
    }
    
    GenerateMap(canvas=null)
    {
        //FUNCTION SELECTOR WHICH WILL CALL ITS SELF RECURSIVELY
        // if function returns false then map generator will move to next step
        // all data is held into the class data pool and is passed between functions
        // at the end of each cycle a delay is called to allow for the canvas to render
        // this will create a animation which will help people see how the algorithm builds
        if(this[this.funcStep]() == false)
        {
            this.funcStep = STEP_FUNC[this.funcStep]; //stack the next step into the slot for next cycle
        }
       RandomMapRender.render();
    }
    //function in order of Step Functions
    Init()
    {
        this.canvas = canvas; //keep a reference just in case
        this.bounds = new Rect(0,0,canvas.width, canvas.height);
        RandomMapRender.init(canvas, this.graph); 
        return false;
    }
    GenerateSites()
    {
       return false;
    }
    CreateVoronoi()
    {
       return false;
    }
    RelaxVoronoi()
    {
       return false;
    }
    HeightGeneration()
    {
       return false;
    }
    LandBuilding()
    {
       return false;
    }
    CoastalCleanup()
    {
       return false;
    }
    TerrianNormalization()
    {
       return false;
    }
    TempatureRoughCover()
    {
       return false;
    }
    WaterSheding()
    {
       return false;
    }
}


//this is a quick wrapper that makes sure that we are the active window before we run our code
rndContainor = document.querySelector("article#RandomMap")
var Map = new RandomMap(); //first instance of class built on load of file;


setTimeout(handleResize, 100);
let canvas = null;
console.log(rndContainor.offsetWidth);

if(rndContainor)
    setInterval(function () {
        console.log(rndContainor.offsetWidth);
        if(rndContainor.className === "active" && canvas)
        {
            Map.GenerateMap(canvas);
            console.log(canvas);
        }
}, 10);
else
    console.error("could not mount canvas to dom, this could be due to browser incompatiblity");

window.addEventListener("resize", handleResize);

function handleResize()
{
    let width = rndContainor.offsetWidth*0.8;
    canvas = rndContainor.querySelector("canvas");
    canvas.width = width;
    canvas.height = width*(9/16);
    //rndContainor.innerHTML = `<canvas width=${width} height=${width*(9/16)}> COULD NOT LOAD CANVAS </canvas>`

    setTimeout(()=>{ }, 200 ); //wait for everything then update canvas object
    
}
