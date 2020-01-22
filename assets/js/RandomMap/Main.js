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
        this.Seeds = { "Map": 0, "Var": 0, "Evol": 0}
        this.props =  // list of props given to the user, set to default (obviously);
        {//min default max

            "Seed Properties": [], //create a header
            "Map Seed":     [-99999, 0, 99999],
            "Variant":  [-99999, Math.random()*9999, 99999],
            "Evolution Seed": [-99999, 0, 99999],

            "Map Properties": [], //create a header
            "Water Height": [0.0001, 0.3, 1.0],
            "Perlin Weight": [0.0, 0, 1.0], //set this slightly above sea level so we get some islands randomly sprinkled
            "Center Weight": [0.0, 1.0, 1.0], //this and the above must equal 1.0 Done this way so you can add more methods as weights
            "Coast Clean Irrations": [1,5,20],
            "Cell Percentage": [0.0001, 0.16, 3],
            "Min Distance": [0.00001, 5, 10],
            "Coastal Roughness": [0.0001, 1.0, 5.0],
            "Normalizations Cycles": [-1, 3, 5],
            "Lake Moisture": [0.0, 0.8, 1.0],
            "Moisture Threshold": [0.000001, 0.01, 0.2],
            "Rain Fall Average": [0.0, 4.0, 10.0],

            "Voronoi Properties": [],
            "LLOYD Irrations": [0, 3, 20],
            "PATEL Irrations": [0, 4, 10],

            "Heigh Point Properties": [],
            "Number of High Points": [6,20],
            "X Range": [1000, 1000],
            "Y Range": [1000, 1000],
            "Elevation Range": [0.8, 0.4],
            "Elevation Dropoff": [1.5, 1.5]
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
    BuildCustomGraph()//this is a support function for converting the voronoi.js class structure to a custom structure in utls (so we can have more free movement through the graph);
    {
        this.graph.cells =[];
        this.graph.edges = [];
        this.graph.corners = [];
        if(!this.diagram) return false;
        let cells = [],c1, c2,  //list of cells we are creating of type utils.cell
        e, //of type utils.edge
        gedge, gedges= this.diagram.edges, gcells = this.diagram.cells,  //of type voronoi.edge
        iCell=gcells.length, iEdge=gedges.length, site;
        while(iCell--) cells.push(new Cell({x: -100000, y: -100000}, iCell));
        while(iEdge--)
        {
            gedge = gedges[iEdge];
            //if(!gedge || !gedge.rSite || !gedge.lSite) continue;
            //for some reasong the cell sites arent lining up with the data given so we have to force it
            site = gedge.lSite;
            if(site)
            {
                c1 = cells[site.voronoiId];
                c1.center.x = site.x;
                c1.center.y = site.y;
            } else c1 = new Cell({x: 0, y: 0}, -1);//should nv get here cuz algorithm only uses lsite as null
            site = gedge.rSite;
            if(site)
            {
                c2 = cells[site.voronoiId];
                c2.center.x = site.x;
                c2.center.y = site.y;
            }else c2 = new Cell({x: 0, y: 0}, -1); //creates fake cell for borders so that we create an edge
            //fake cells always have id -1 so we can easily detect them and not render them

            e = new Edge(gedges[iEdge].vb, gedges[iEdge].va, c1, c2, iEdge, this.graph.corners);
            this.graph.edges.push(e); //takes care of doing the edges;
            //if(gedge.rSite.voronoiId == gedges.lSite.voronoiId) console.log("dub site");
        }

        let iCorner = this.graph.corners.length;
        while(iCorner--)this.graph.corners[iCorner].GatherNeighbors();
        this.graph.cells = cells;
        //keep in mind all this function really does is builts the graph data from the diagram data
        return false;
    }
    GenerateMap(canvas) //main loop
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
            this.funcStep = STEP_FUNC[this.funcStep]; //stack the next step into the slot for next cycle
        }

        if(this.shouldRender) RandomMapRender.render(this.graph); //only render if we should render so we dont get weird rerender glitch
    }
    //function in order of Step Functions
    Init()
    {
        this.canvas = canvas; //keep a reference just in case
        this.bounds = new Rect(0,0,canvas.width, canvas.height);
        this.BuildCustomGraph();
        RandomMapRender.init(canvas, this.graph);
        this.Seeds.Map = new Random(this.props["Map Seed"][1]);
        this.Seeds.Var = new Random(this.props["Variant"][1]);
        this.Seeds.Evol = new Random(this.props["Evolution Seed"][1]);
        return false;
    }
    GenerateSites()
    {
        let margin = 10; //some padding so we dont go to far
        let height = this.bounds.height() - margin*2;
        let width = this.bounds.width() - margin*2;
        let sitenumber = Math.max((width * height * this.props["Cell Percentage"][1]* 0.01),3);
        let irr = Math.min(sitenumber-this.graph.sites.length,500); //only do 100 at a time
        let random = this.Seeds.Map;
        for(let i = 0; i < irr; i++)
        {
            this.graph.sites.push(new Vec2(random.randomRange(this.bounds.minX+margin, this.bounds.maxX-margin),random.randomRange(this.bounds.minY+margin, this.bounds.maxY-margin)));
        }
        this.Voronoi.recycle(this.diagram);
        this.diagram = this.Voronoi.compute(this.graph.sites, this.bounds.convertxxyy() );
        
        //this.graph = this.diagram;
        this.BuildCustomGraph()
        return this.graph.sites.length < sitenumber;
    }
    LloydRelaxation()
    { // most of this function is a direct pull from raymond hills work with small modifications to work with this system
        //Found minor bugs so needed a way to patch them and allow user more flexiblity with not fully relaxing graph if desired.
        let cells = this.diagram.cells,
        random = this.Seeds.Map, //set this to the map seed random
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
        this.graph.sites = sites;
        this.Voronoi.recycle(this.diagram);
        this.diagram = this.Voronoi.compute(this.graph.sites, this.bounds.convertxxyy());
        this.BuildCustomGraph()
        return this.dataStack.irr < this.props["LLOYD Irrations"][1] ; //basically dont over do relaxation to give user control over the Uniformity of cell regions
    }
    PatelRelaxation() //from here out we are using types defined in Utls.js instead of Voronoi.js so we have more control of the graph data
    {
        if(this.props["PATEL Irrations"][1] === 0 ) return false; //exit if the user wishes not to use Patel's algorithm
        this.dataStack.irrations = this.dataStack.irrations ? this.dataStack.irrations+1 : 1; //set up our irration data
        let iCorner = this.graph.corners.length, corners = this.graph.corners,
        q,p1, cellneighbors = [], newpos = new Array(iCorner),
        bounds = this.bounds;
        //main idea of this algorithm as oulined in the paper is to average the corners based on the other corners of a given cell
        // this will stretch out the edges and make them more defined and give us a cleaner look to our cells
        //we will double irrate through the corners array so not to create an issue with the data. if we move them right away this could
        //cause an issue where the data is skewed because of the new averages based on moved corners
        while(iCorner--) //we do one irration 
        {
            q = corners[iCorner];
            if(q.IsBoundary(bounds)) {newpos[iCorner] = q.position; continue;} //if cell is on the edge of the map we dont wanna relax it

            p1 = new Vec2(0,0);
            cellneighbors = q.touches; //touches is the cells that the corner is touching or is a vertex of this can be between 1 and (in rare case) and 4 (in more common cases)
            if(cellneighbors.length <= 0){ newpos[iCorner] = q.position; console.log("Cell Neightbor not assigned"); continue;} //weird bug that came up in the old method rarely
            let len = cellneighbors.length;
            for(let j = 0;  j < len; j++)
                p1 = p1.add(cellneighbors[j].center); //get the middle of each cell and add them all up
            p1 = new Vec2(len,len).div(p1); //divide by the length of the cell neighbors onces they are all summed, (average)
            newpos[iCorner] = p1;
            
        }
        iCorner = this.graph.corners.length;
        while(iCorner--) this.graph.corners[iCorner].position = newpos[iCorner];
        //keep going till we reach the amount defined (keep in mind false moves on true keeps going)
        return this.props["PATEL Irrations"][1] > this.dataStack.irrations; 
    }
    HeightGeneration() //starting here we will use Varient random for everything
    {
        //here lets start defining things on the stack that we want saved. We will save these to the graph data so they stay around
        let random = this.Seeds.Var;
        this.graph = //we add the meta data to the graph here we mayneed to move this
        {
            ...this.graph,
            LandCorners: [],
            LakeCorners: [],
            OceanCorners: [],
            CoastCorners: [],
            HighCorners: []
        }
        
        this.dataStack.highpoints = [];
        this.dataStack.irr = 1;

        //what we did do was build a new voronoi graph and then set our high points based on that. This would be more complex so for now we are just gonna go pure random 
        let numpts = this.props["Number of High Points"];
        let irr = Math.ceil(random.randomRange(Math.min(numpts[0], numpts[1]), Math.max(numpts[0], numpts[1]))),
        bounds = new Rect(
            this.bounds.minX + this.bounds.width() * 0.08,
            this.bounds.minY + this.bounds.height() * 0.08, 
            this.bounds.maxX - this.bounds.width() * 0.08,
            this.bounds.maxY - this.bounds.height() * 0.08
            ),
        highpoints = [];
        while(irr--)
        {
            highpoints.push(new Highpoint(
                random.randomRange(bounds.minX,bounds.maxX),
                random.randomRange(bounds.minY,bounds.maxY),
                random.randomRange(this.props["X Range"][0],this.props["X Range"][1]),
                random.randomRange(this.props["Y Range"][0],this.props["Y Range"][1]),
                random.randomRange(this.props["Elevation Range"][0],this.props["Elevation Range"][1]),
                random.randomRange(this.props["Elevation Dropoff"][0],this.props["Elevation Dropoff"][1]),
            ));
        }
        this.graph.highpoints = highpoints;
        return false;
    }
    LandBuilding()
    {
        let CenterWeight = this.props["Center Weight"][1], PerlinWeight = this.props["Perlin Weight"][1], WaterHeight = this.props["Water Height"];
        let t = Math.max(CenterWeight + PerlinWeight, 0.00000001) //so we dont div by 0;
        CenterWeight /= t, PerlinWeight /= t; //set up weights

        //get our max number of nodes over all irrations
        this.dataStack.num = this.dataStack.num ? this.dataStack.num : this.graph.corners.length;
        let max = 500;
        let i = this.dataStack.num, random = this.Seeds.Var, elevation, chance;
        const calculatefromhighpoints = (hps, point) => //little helper function set to const so we dont have to worry about defining it each time
        {
            let r, d, n, x=0, b, y=0, total = 0;
            let index = -1, leastdist = Infinity, // set this to infinity so nothing can match it
            dist, iHigh = hps.length, pos, p = new Vec2(point.x, point.y),h;
            while(iHigh--)
            {
                h = hps[iHigh];
                pos = h.position;
                dist = p.dist(pos); //kinda hate that we dont have type casting for these reasons
                leastdist = h.size.y > h.size.x ? h.size.y : h.size.x; //miniumdistance that we should even consider calculating (this is where this highpoint would give 0.0 < to the elevation)
                if(dist < leastdist && random.randomRange(0,5) >= this.props["Coastal Roughness"][1]) // add in some random chance that we assign a lower elevation so we get more islands around our islands
                {
                    // here we are gonna deviate from the original code and base our stuff on all highpoints rather than one this should give us better results
                    /*f\left(x\right)=\left|\frac{8r}{x}\left|\sin\left(\frac{d\cdot1000}{x}\right)\right|\ +\frac{2^{b}}{\left(x\right)}\right|*/
                    //f(x) = |(8r)/x * |sin(30,000/x)| + (2^b)/x|
                    //where y = f(x) > 1.5 ? 1.5 : f(x); and undefined outside the max range
                    //formula in which we can use an range offset and make x the dist between the point and the hp + random.range which will give us a controled random

                    //calculate the x dist and y dist seperately as each has a different data set
                    x = Math.max(Math.abs(p.x-pos.x) - random.randomRange(0,5), 0.001); //this function is not defined at 0 so we dont wanna get NaN, add some random offset to give us some random ocollation
                    y = Math.max(Math.abs(p.y-pos.y) - random.randomRange(0,5), 0.001);
                    
                    n = new Vec2(x,y).normalize();
                    b = h.dispation;
                    r = h.range;
                    d = h.occolation;
                    
                    //set x and y to the new value assigned by this formula make sure we are still in the domain of the highpoint;
                    if(h.size.x >= x) x = Math.abs(((8*r)/x) * Math.abs(Math.sin((d*1000)/x)) + (Math.pow(2,b)/x))*h.elevation*Math.abs(n.x); else x =0;
                    if(h.size.y >= y) y = Math.abs(((8*r)/y) * Math.abs(Math.sin((d*1000)/y)) + (Math.pow(2,b)/y))*h.elevation*Math.abs(n.y); else y=0;
                    total += x+y;
                }
            }
            return total;
        }
        //base setup of variables
        let q, pos, neighbors;

        while( i-- && max--) // basically go max times unless this.dataStack.num is less
        {
            q = this.graph.corners[i];
            //console.log(q.HasTerrianValue());
            if(false) continue; //if we have already processed this value then we want to skip it. this is mainly for corners
            if(q.IsBoundary(this.bounds)) //if we on the edge we want to be ocean so no more calc needed
            {
                //handle map edges
                //neighbors = q.neighbors;
                q.SetTerrianProperties(0,1,TerrainType.OCEAN);
                this.graph.OceanCorners.push(q);
                q.touches.forEach(x => x.SetCornerAverage()); //go to each corner this guy touches and recalc the data
                continue;
            }

            elevation = (random.random() * PerlinWeight) + (calculatefromhighpoints(this.graph.highpoints, q.position) * CenterWeight);

            if(elevation < WaterHeight)
            {
                neighbors = q.neighbors;
                chance = 0;
                for (let j = 0; j < neighbors.Count; j++)
                {//basically set up a random chance based on surounding Terrain
                    if (neighbors[j].terrian == TerrianType.LAND) chance += 3; 
                    else if (neighbors[j].terrian == TerrianType.LAKE) chance--; 
                    else if (neighbors[j].terrian == TerrianType.OCEAN) chance++; //add a chance that land will clump a lil
                    else ;//unprocessed do nothing
                }
                //this will be water
                if(random.randomRange(0, 100*chance)*0.01 < 1.5)
                {
                    q.SetTerrianProperties(elevation,1.0, TerrainType.LAKE); //keep in mind lake will be ocean if can reach edge of map
                    this.graph.LakeCorners.push(q);
                    q.touches.forEach(x => x.SetCornerAverage()); //update cells
                    continue; //exit here 
                }
            }
            q.SetTerrianProperties(elevation, 0.0, TerrainType.LAND);
            this.graph.LandCorners.push(q);
            q.touches.forEach(x => x.SetCornerAverage());
        }

        this.dataStack.num = i;
        return this.dataStack.num >= 0;
    }
    CoastalCleanup()
    {
       return false;
    }
    TerrianNormalization()
    {
       return false;
    }
    TempatureRoughCover() //starting here we will use evolutionary seed
    {
       return false;
    }
    WaterSheding()
    {
        this.shouldRender = false;
        let ctx = this.canvas.getContext('2d');
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
}, 150);
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
    //rndContainor.innerHTML = `<canvas width=${width} height=${width*(9/16)}> COULD NOT LOAD CANVAS </canvas>`
