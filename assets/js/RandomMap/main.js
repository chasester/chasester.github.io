//Main loop for the RanomMap generator
//This is responsible for most of the logic and calling the renderer inbtween intervles


var STEP_FUNC = //string function types which allow us to to do dynamic step calling
{
    "Init": "GenerateSites", //init only runs on the first pass
    "GenerateSites": "LloydRelaxation",
    "LloydRelaxation": "PatelRelaxation",
    "PatelRelaxation": "HeightGeneration",
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
        this.Voronoi = new Voronoi(); //external library class
        this.diagram = null; //diagram is the data from the voronoi class
        this.graph ={ //this is our interal storage of the data we get from the graph set up exactly the same as the diagram but with internal class variables
        corners: [], //list of internal corners
        cells: [], //list of internal cells
        sites: [], //list of internal vec2 points randomly picked from seed
        edges: []  //list of internal edges
        }
        this.shouldRender = true;
        this.dataStack = {}; //this is a raw stack of data that each function can create to basically store on leaving the function for the next frame
        this.funcStep = "Init"; //start with an init function;
        this.isRunning = false; // allow to recycle to next step or should we stop recursively calling
        this.stepId = 0; //id 0 means that we are starting from the begining of the cycles
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
            "Cell Percentage": [0.0001, 1.0, 3.0],
            "Min Distance": [0.00001, 5, 10],
            "CoastalRoughness": [0.0001, 1.0, 5.0],
            "Normalizations Cycles": [-1, 3, 5],
            "Lake Moisture": [0.0, 0.8, 1.0],
            "Moisture Threshold": [0.000001, 0.01, 0.2],
            "Rain Fall Average": [0.0, 4.0, 10.0],

            "Voronoi Properties": [],
            "LLOYD Irrations": [0, 3, 20],
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
    
    GenerateMap(canvas)
    {
        //FUNCTION SELECTOR WHICH WILL CALL ITS SELF RECURSIVELY
        // if function returns false then map generator will move to next step
        // all data is held into the class data pool and is passed between functions
        // at the end of each cycle a delay is called to allow for the canvas to render
        // this will create a animation which will help people see how the algorithm builds
        if(this[this.funcStep]() == false)
        {
            this.dataStack = {}; //reset data stack so we dont have collisions
            this.funcStep = STEP_FUNC[this.funcStep]; //stack the next step into the slot for next cycle
        }

        if(this.shouldRender) RandomMapRender.render(this.diagram); //only render if we should render so we dont get weird rerender glitch
    }
    //function in order of Step Functions
    Init()
    {
        this.canvas = canvas; //keep a reference just in case
        this.bounds = new Rect(0,0,canvas.width, canvas.height);
        RandomMapRender.init(canvas, this.diagram);
        return false;
    }
    GenerateSites()
    {
        let margin = 500; //some padding so we dont go to far
        let height = this.bounds.height() - margin*2;
        let width = this.bounds.width() - margin*2;
        let sitenumber = Math.max((width * height * this.props["Cell Percentage"][1]* 0.01),3);
        let irr = Math.min(sitenumber-this.graph.sites.length,100); //only do 10 at a time
        for(let i = 0; i < irr; i++)
        {
            this.graph.sites.push(new Vec2(random.random()*this.bounds.width() + random.random()/this.bounds.width(), random.random()*this.bounds.height() + random.random()/this.bounds.height()));
        }
        this.Voronoi.recycle(this.diagram);
        this.diagram = this.Voronoi.compute(this.graph.sites, this.bounds.convertxxyy() );
        
        //this.graph = this.diagram;
        
        return this.graph.sites.length < sitenumber;
    }
    LloydRelaxation()
    { // most of this function is a direct pull from raymond hills work with small modifications to work with this system
        //Found minor bugs so needed a way to patch them and allow user more flexiblity with not fully relaxing graph if desired.
        let cells = this.diagram.cells,
        iCell = cells.length,
        cell,
        site, sites = [],
        again = false,
        rn, dist;
        let p = 1 / iCell *0.1;
        this.dataStack.irr = this.dataStack.irr ? this.dataStack.irr + 1 : 1; //set up our data stack and then add new data too it
        //support function  
        let cellCentroid = function(cell) {
            //support function
            let cellArea = function(cell) {
                var area = 0,
                    halfedges = cell.halfedges,
                    iHalfedge = halfedges.length,
                    halfedge,
                    p1, p2;
                while (iHalfedge--) {
                    halfedge = halfedges[iHalfedge];
                    p1 = halfedge.getStartpoint();
                    p2 = halfedge.getEndpoint();
                    area += p1.x * p2.y;
                    area -= p1.y * p2.x;
                    }
                area /= 2;
                return area;
            }
            var x = 0, y = 0,
                halfedges = cell.halfedges,
                iHalfedge = halfedges.length,
                halfedge,
                v, p1, p2;
            while (iHalfedge--) {
                halfedge = halfedges[iHalfedge];
                p1 = halfedge.getStartpoint();
                p2 = halfedge.getEndpoint();
                v = p1.x*p2.y - p2.x*p1.y;
                x += (p1.x+p2.x) * v;
                y += (p1.y+p2.y) * v;
                }
            v = cellArea(cell) * 6;
            return {x:x/v,y:y/v};
            }

        while (iCell--)
        {
            cell = cells[iCell];
            rn = random.random();
            // probability of apoptosis
            if (rn < p) {
                continue;
                }
            site = cellCentroid(cell);
            dist = new Vec2(site.x, site.y).dist(cell.site);
            dist = isNaN(dist) ? 0.000001 : dist;
            again = again || dist > 0.01;
            // don't relax too fast
            if (dist > 2) {
                site.x = (site.x+cell.site.x)/2;
                site.y = (site.y+cell.site.y)/2;
                }
            // probability of mytosis
            if (rn > (1-p)) {
                dist /= 2;
                sites.push({
                    x: site.x+(site.x-cell.site.x)/dist,
                    y: site.y+(site.y-cell.site.y)/dist,
                    });
                }
            sites.push(site);
        }

        if(sites.filter(x => isNaN(x.x) || isNaN(x.y)).length > 0) return false; //fixes a bug where a site becomes NaN and kills all other sites onces all sites have been relaxed
        console.log(this.diagram);
        this.graph.sites = sites;
        this.Voronoi.recycle(this.diagram);
        this.diagram = this.Voronoi.compute(this.graph.sites, this.bounds.convertxxyy());
        return this.dataStack.irr < this.props["LLOYD Irrations"][1] ; //basically dont over do relaxation to give user control over the Uniformity of cell regions
    }
    PatelRelaxation()
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
        this.shouldRender = false;
        return true;
    }
}


//this is a quick wrapper that makes sure that we are the active window before we run our code
rndContainor = document.querySelector("article#RandomMap")
var Map = new RandomMap(); //first instance of class built on load of file;

var canvas;
canvas =  rndContainor.querySelector("canvas");
//setTimeout(handleResize, 100);

if(rndContainor)
    setInterval(function () {
        if(rndContainor.className === "active" && canvas)
        {
            Map.GenerateMap(canvas);
        }
}, 100);
else
    console.error("could not mount canvas to dom, this could be due to browser incompatiblity");

/* window.addEventListener("resize", handleResize);

function handleResize()
{
    let width = rndContainor.offsetWidth*1.1;
    canvas = rndContainor.querySelector("canvas");
    canvas.width = width;
    canvas.height = width*(9/16);
} */