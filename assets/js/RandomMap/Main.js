//Main loop for the RanomMap generator
//This is responsible for most of the logic and calling the renderer inbtween intervles

class RandomMap extends CanvasTarget
{
    /* static */ STEP_FUNC = //string function types which allow us to to do dynamic step calling
    {//remove static cuz its not globally suported
            "Init":                 "GenerateSites", //init only runs on the first pass
            "GenerateSites":        "LloydRelaxation",
            "LloydRelaxation":      "PatelRelaxation",
            "PatelRelaxation":      "HeightGeneration",
            "HeightGeneration":     "LandBuilding",
            "LandBuilding":         "CoastalCleanup",
            "CoastalCleanup":       "LandGathering",
            "LandGathering":        "TerrianNormalization",
            "TerrianNormalization": "TempatureRoughCover",
            "TempatureRoughCover":  "Done",
            "Done":                 ""
    }
    constructor()
    {
        let container = document.querySelector("article#RandomMap");
        let canvas = container.querySelector("canvas");
        super(container,canvas);
        //super declares containter canvas and camera properties of this class

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
            "Map Seed":     [-99999,  Math.floor(Math.random()*9999), 99999],
            "Variant":  [-99999, Math.floor(Math.random()*9999), 99999],
            "Evolution Seed": [-99999,  Math.floor(Math.random()*9999), 99999],

            "Map Properties": [], //create a header
            "Water Height": [0.0001, 0.35, 1.0],
            "Perlin Weight": [0.0, 0.28, 1.0], //set this slightly above sea level so we get some islands randomly sprinkled
            "Center Weight": [0.0, 0.72, 1.0], //this and the above must equal 1.0 Done this way so you can add more methods as weights
            "Coast Clean Irrations": [1,2,20],
            "Cell Percentage": [0.0001, 1.6, 3],
            "Min Distance": [0.00001, 5, 10],
            "Coastal Roughness": [0, 1.5, 5.0],
            "Normalizations Cycles": [-1, 3, 5],
            "Normalization Depth": [1, 3, 5],
            "Lake Moisture": [0.0, 0.8, 1.0],
            "Moisture Threshold": [0.000001, 0.01, 0.2],
            "Rain Fall Average": [0.0, 4.0, 10.0],

            "Voronoi Properties": [],
            "LLOYD Irrations": [0, 3, 20],
            "PATEL Irrations": [0, 4, 10],

            "Heigh Point Properties": [],
            "Number of High Points": [10,10],
            "X Range": [100, 200],
            "Y Range": [100, 300],
            "Elevation Range": [0.7, 0.9],
            "Elevation Dropoff": [0.9, 1.9]
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
            this.dataStack = {}; //reset data stack so we dont have collisions
            this.funcStep = this.STEP_FUNC[this.funcStep]; //stack the next step into the slot for next cycle
        }
        let status = this.funcStep.replace( /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5' );
        if(this.shouldRender) RandomMapRender.render(this.graph, this.camera, status); //only render if we should render so we dont get weird rerender glitch
    }
    //function in order of Step Functions
    Init()
    {
        if(this.dataStack.nexttime) return this.dataStack.nexttime > new Date().getTime();
        this.bounds = new Rect(0,0,this.canvas.width, this.canvas.height);
        this.graph = { //this is our interal storage of the data we get from the graph set up exactly the same as the diagram but with internal class variables
            corners: [], //list of internal corners
            cells: [], //list of internal cells
            sites: [], //list of internal vec2 points randomly picked from seed
            edges: []  //list of internal edges
            }
        this.BuildCustomGraph();
        RandomMapRender.init(this.canvas, this.graph);
        this.Seeds.Map = new Random(Math.floor(Math.random()*9999));
        this.Seeds.Var = new Random(Math.floor(Math.random()*9999));
        this.Seeds.Evol = new Random(Math.floor(Math.random()*9999));
        console.log(`Using Seeds:\n\tMap:${this.Seeds.Map.s}\n\tVarient:${this.Seeds.Var.s}\n\tEvolution:${this.Seeds.Evol.s}` ) 
        this.dataStack.nexttime = new Date().getTime()+1000;
        return true;
        
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
        let center = this.bounds.center();
        this.graph.corners.sort((x,y) => -center.dist(x.position) + center.dist(y.position)); //sort from center
        //this.graph.corners.sort((x,y) => random.hash(x.position.x, x.position.y) - random.hash(y.position.x, y.position.y)); //sort from random hash basically garentees the same result every time;
        return false; //need to come back and look at this. causing a render bug;
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
        this.graph = //we add the meta data to the graph here we may need to move this
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
        let CenterWeight = this.props["Center Weight"][1], PerlinWeight = this.props["Perlin Weight"][1], WaterHeight = this.props["Water Height"][1];
        let t = Math.max(CenterWeight + PerlinWeight, 0.00000001) //so we dont div by 0; should always = 1 but there are no constraints to the settings
        CenterWeight /= t, PerlinWeight /= t; //set up weights

        //get our max number of nodes over all irrations
        this.dataStack.num = this.dataStack.num ? this.dataStack.num : this.graph.corners.length;
        let max = 250;
        let i = this.dataStack.num, random = this.Seeds.Var, elevation, chance;
        const calculatefromhighpoints = (hps, point) => //little helper function set to const so we dont have to worry about defining it each time
        {
            //This is where we build our gray scale of hieght elevation, where any thing below waterhieht is concidered (below sea level)(darker colors) 
            //and anything above sea level is land(keep in mind) that we assign below sea level as lake,but that doesnt gaurentee it being lake as we dont
            //assign actual lake tiles till after watersheding, This is just a way for the next function to gather all touching ocean tiles and add them to
            //ocean if they are not land locked.

            //The base algorithm is basically a occlitory sin wave (lim |dist(h.pos -point)| -> 0 = h.elevation) but the inverse is a more
            // long occilatory graph which makes some fun math that can basically can randomly create islands even at far away (but these islands are or 2 tiles) and very random
            let r, d, n, CR, x=0, b, y=0, total = 0;
            let leastdist, // set this to infinity so nothing can match it
            dist, iHigh = hps.length, pos, p = new Vec2(point.x, point.y),h;
            while(iHigh--)
            {
                h = hps[iHigh];
                pos = h.position;
                dist = p.dist(pos); //kinda hate that we dont have type casting for these reasons
                leastdist = h.size.y > h.size.x ? h.size.y : h.size.x; //miniumdistance that we should even consider calculating (this is where this highpoint would give 0.0 < to the elevation)
                if(dist < leastdist)
                {
                    // here we are gonna deviate from the original code and base our stuff on all highpoints rather than one this should give us better results
                    /*f\left(x\right)=\left|\frac{8r}{x}\left|\sin\left(\frac{d\cdot1000}{x}\right)\right|\ +\frac{2^{b}}{\left(x\right)}\right|*/
                    //f(x) = |(8r)/x * |sin(30,000/x)| + (2^b)/x|
                    //where y = f(x) > 1.5 ? 1.5 : f(x); and undefined outside the max range
                    //formula in which we can use an range offset and make x the dist between the point and the hp + random.range which will give us a controled random

                    //calculate the x dist and y dist seperately as each has a different data set
                    x = Math.max(Math.abs(p.x-pos.x - random.randomRange(-5,5)), 0.001); //this function is not defined at 0 so we dont wanna get NaN, add some random offset to give us some random ocollation
                    y = Math.max(Math.abs(p.y-pos.y - random.randomRange(-5,5)), 0.001);
                    
                    n = new Vec2(x,y).normalize();
                    b = h.dispation;
                    r = h.range;
                    d = h.occolation;
                    CR = 1/(1+this.props["Coastal Roughness"][1]) //add some randomness here to make it more delevation
                    
                    //set x and y to the new value assigned by this formula make sure we are still in the domain of the highpoint;
                    if(h.size.x >= x) x = Math.min(Math.abs(((8*r)/x) * Math.abs(Math.sin((d*1000)/x)) + (Math.pow(2,b)/x))*h.elevation, h.elevation*Math.abs(n.x))*CR; else x =0;
                    if(h.size.y >= y) y = Math.min(Math.abs(((8*r)/y) * Math.abs(Math.sin((d*1000)/y)) + (Math.pow(2,b)/y))*h.elevation, h.elevation*Math.abs(n.y))*CR; else y=0;
                    total += (x+y);
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
                    if (neighbors[j].terrain == TerrainType.LAND) chance += 3; 
                    else if (neighbors[j].terrain == TerrainType.LAKE) chance--; 
                    else if (neighbors[j].terrain == TerrainType.OCEAN) chance++; //add a chance that land will clump a lil
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
            q.touches.forEach(x => {x.SetCornerAverage();});
            if(elevation > 0.9) this.graph.HighCorners.push(q);
        }
        this.dataStack.num = i;
        return this.dataStack.num >= 0;
    }
    CoastalCleanup()
    {   
        //we need to now find our map edge corners (conviently placed in the oceans terrain) then cycle through there neighbors till we get 
        //to corners marked as land. We will change each of these corners from lake to ocean and move them from the Lake list to the ocean list.
        //this will be similar to a b* algorithm were we will follow a branch til we have reach a dead end then we will go to the next branch
        //once weve come in from every corner edge of the map (that we marked as ocean in the preivous function) we know we have hit every possible
        //section of the map and we know that all the land is surrounded by ocean.
        
        let que = this.dataStack.que ? this.dataStack.que : this.graph.OceanCorners;
        this.dataStack.cleanirr = this.dataStack.cleanirr ? this.dataStack.cleanirr : 0; //number of times the clean function has been fired (see Coast Clean Irrations setting)
        let max = 500; //max irrations in one frame cycle
        let neighbors; //of corners
        let q, s; //of corner
        let nlen;
        
        while(que.length && max--)
        {
            q = que.shift(); //get the first item;
            neighbors = q.neighbors;
            nlen = neighbors.length;
            while(nlen--)
            {
                s = neighbors[nlen];
                if(s.terrain == TerrainType.OCEAN || s.terrain == TerrainType.COAST) continue;
                if(s.terrain == TerrainType.LAND) { this.graph.CoastCorners.push(s); s.terrain = TerrainType.COAST; continue; }
                //else Type Lake
                s.terrain = TerrainType.OCEAN;

                que.push(s); //we add this to the que so that we can check its neighbors
                //due to this being a very bad way to do this we will handle the clean on exit
                //this.graph.LakeCorners.splice(s); //we want to make sure to keep the lake list clean so it only contains the lake elements. This item is an ocean element os we dotn want it here
                this.graph.OceanCorners.push(s);
            }
            q.touches.forEach(x => x.SetTerrain()); //go in and tell all our cells what we are now and get our averages, this will allow better rendering;
        }
        
        if(que.length < 1 && this.dataStack.cleanirr < this.props["Coast Clean Irrations"][1])
        {
            //This is what we are going to do to make our islands a bit cleaner so that we have less of a chance of getting straggler islands along the edges of the islands,
            //if (once the ocean is populated) there is an area of land lock water(ie land below the sealevel, next to a coast, there is a chance that errotion could happen 
            //and destroy this island ingulfing it with water and freeing the trapped "lake")
            //So we will search for these trapped potential bodies of water and remove the land to free them, on a few random case variables
            this.dataStack.cleanirr++;
            let newcoast = []; //of corners;
            let len = this.graph.CoastCorners.length, chance;
            while(len--)
            {
                chance = 0;
                q = this.graph.CoastCorners[len];
                chance = q.neighbors.filter(x => x.terrain == TerrainType.LAKE).length;
                /* neighbors = q.neighbors;
                nlen = neighbors.length;
                while(nlen--) if(neighbors[nlen].terrain == TerrainType.LAKE) chance++; */
                // basically if you score a 0.499 or lower then you will not become an ocean corner, else you become ocean
                //added elevation to help islands with high mountains not become overran irrationally
                if(!Math.round(Math.max(this.Seeds.Var.randomRange(0,Math.pow(2,chance)-q.elevation*0.5),0.0))){newcoast.push(q); continue;} //add the items that dont get added to coast here.
                q.terrain = TerrainType.OCEAN;
                que.push(q);
                this.graph.OceanCorners.push(q);
            }
            this.graph.CoastCorners = newcoast;
        }

        if(que.length < 1) //we are done now
        {
            this.graph.LakeCorners = this.graph.LakeCorners.filter(x=> x.terrain != TerrainType.OCEAN); //make sure our land doesnt have any oceans :P
            this.graph.LakeCorners.forEach(x => x.terrain = TerrainType.LAND);
            this.graph.LandCorners = this.graph.LakeCorners.concat(this.graph.LandCorners);
            this.graph.LakeCorners = []; //remove all lake corners we will assign these during water shedding;
            return false;
        }//else
        this.dataStack.que = que;
        return true;
    }
    LandGathering()
    {
        this.dataStack.i = this.dataStack.i ? this.dataStack.i : 0;
        let i = this.dataStack.i;

        for(let len = this.graph.cells.length, max = 500; i < len && max--; i++)
            this.graph.cells[i].SetTerrain();
        this.dataStack.i = i;
        return i < this.graph.cells.length;
    }
    TerrianNormalization() 
    {//Now we want to normalize our gradial terrian so we get more consistent features, We ill be randomly unnormalizing vectors to add some hilly areas
        this.dataStack.iNormal = this.dataStack.iNormal ? this.dataStack.iNormal : this.props["Normalizations Cycles"][1];
        this.dataStack.que = this.dataStack.que ? this.dataStack.que : this.graph.cells;
        this.dataStack.i = this.dataStack.i ? this.dataStack.i : 0;
        this.dataStack.newelv = this.dataStack.newelv ? this.dataStack.newelv : {};
        if(this.dataStack.iNormal < 1) return false; //take care of the case that normalization is not requested
        //main delcarations
        let c, cr, eavg, etotal, que = this.dataStack.que, stack= {}, newelv = this.dataStack.newelv, 
            i = this.dataStack.i, max = 2000, len = que.length, n = this.props["Normalization Depth"][1];

        //helper functions
        const gatherneighbors = (c) => c.neighbors.forEach(x => {if(x.id > -1) stack[String(x.id)] = x}); //this function will take all the neighbors and add them to our stack list by id
        const getdepthlevels = (c,n) => 
        {
            if(n < 1) return;
            gatherneighbors(c);
            c.neighbors.forEach(x => getdepthlevels(x, n-1));
        }

        for(; max-- && i < len; i++)
        {
            if(this.Seeds.Evol.random() < 0.5) continue;
            c = que[i];
            stack = {};
            eavg = 0;
            getdepthlevels(c, n); //this fills up stack with all neighbors N tiles away
           // gatherneighbors(c);
            cr = Object.keys(stack);
            
            cr.forEach(x => eavg += stack[x].elevation); //sum all cells elevation up
            eavg = eavg/cr.length;
            if(isNaN(eavg)) {console.log("hello"); continue;}
            //keep in mind we set this to an object so we dont influence the average untill we know we have finished all calculations for this irration
            newelv[String(c.id)] = (eavg)*0.3 + c.elevation*0.7; //make the new average have 30% influence to the old average (ie lerp with an A=0.3); so we dont get drastic changes
        }
        if(i >= len)
        { //we have finished a cycle so lets reset everything
            i = 0;
            this.dataStack.iNormal -= 1;
            let el;
            this.graph.cells.forEach( x=> { el = newelv[String(x.id)]; x.elevation = isNaN(el) || el == undefined || el < 0  || el == Infinity ? x.elevation : el})
            //Object.keys(newelv).forEach(x=> this.graph.cells[parseInt(x)].elevation = newelv[x]);
            newelv = {};
        }
        this.dataStack.i = i;
        return this.dataStack.iNormal > 0; //check to see if we need to keep normalizing the terrain or we have done enough irrations
    }
    TempatureRoughCover() //starting here we will use evolutionary seed
    {
        this.graph.done = true;
        return false;
    }
    Done()
    {
        //this.shouldRender = false;
        //let ctx = this.canvas.getContext('2d');
        return true;
    }
}
let rndmap = new RandomMap();
CanvasMgr.AddCanvas(rndmap);
var RegenerateRandomMap = () => console.log(rndmap.funcStep = "Init");

//Removed this code and moved to global canvas manager class
////this is a quick wrapper that makes sure that we are the active window before we run our code
/* rndContainor = document.querySelector("article#RandomMap")
var Map = new RandomMap(); //first instance of class built on load of file;
var RegenerateRandomMap = () => Map = new RandomMap();
var canvas, camera;
canvas =  rndContainor.querySelector("canvas");

if(rndContainor)
    setInterval(function () {
        if(rndContainor.className === "active" && canvas)
        {
            if(!camera) camera = new Camera(canvas);
            Map.GenerateMap(canvas);
        }
        else{
            if(camera){ camera.deactivate(); camera = null; } //remove listeners
        }
}, 150);
else
    console.error("could not mount canvas to dom, this could be due to browser incompatiblity"); */

/* window.addEventListener("resize", handleResize);

function handleResize()
{
    let width = rndContainor.offsetWidth*1.1;
    canvas = rndContainor.querySelector("canvas");
    canvas.width = width;
    canvas.height = width*(9/16);
} */
    //rndContainor.innerHTML = `<canvas width=${width} height=${width*(9/16)}> COULD NOT LOAD CANVAS </canvas>`