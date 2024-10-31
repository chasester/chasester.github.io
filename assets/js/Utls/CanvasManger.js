class CanvasTarget
{
    constructor(container, canvas, props={})
    {
        this.container = container;
        this.canvas = canvas;
        this.camera = new Camera(this.canvas);
        this.active = false;
        this.props = props;

        let sliderContainter = container.querySelector("#SliderContainter");
        this.SetupSliders(sliderContainter);
    }
    SetupSliders(container)
    {
        
        let keys = Object.keys(this.props);
        let header = null;
        if(keys.length > 0) container.innerHTML += '<h3 class="major" style="padding: 0; margin-bottom: 10px">Settings</h3>'
        for(let i = 0; i < keys.length; i++){
            let elm = this.props[keys[i]];
            if (elm.length == 0) // is header
            {
                header = document.createElement("h4");
                //header.className = "major";
                header.innerText = `${keys[i]}`
                header.style.margin = "10px 0";
                container.insertAdjacentElement("BeforeEnd",header);
            }
            if (elm.length < 3) continue;
            let input   = document.createElement("input");
            let label = document.createElement("label");
            label.style.display = "flex";
            label.style.opacity = 0.75;
            label.className = "property"
            label.innerHTML = `<label style="padding-right: 5px; margin: 0;">${keys[i]}:</label><label style="margin: 0;" id=value${i}>${elm[1]}</label>`
            label.style.margin = "5px 10px -7px 10px ";
            input.type = "range";
            input.min = elm[0];
            input.max = elm[2]
            input.step = elm[1] % 1 === 0 ? 1 : Math.floor((elm[2] - elm[0])*100)/10000 ;
            input.value = elm[1];
            input.style.margin = "5px 0 -7px 10px ";
            input.style.width = `calc(100% - 40px)`;
            input.onmouseover = ()=>{label.style.opacity = 1.0; label.style.fontWeight = 900; }
            input.onmouseout = ()=>{label.style.opacity = 0.7; label.style.fontWeight = 200; }
            input.oninput = ()=>{container.querySelector(`label#value${i}`).textContent = input.value}
            input.onchange = (()=>{this.Setproperty(keys[i], input.value)})
           //input.addEventListener("onInput",()=>{input.querySelector("label#value").textContent = input.value});
            input.addEventListener("onChange",()=>{console.log("hello");});
            container.insertAdjacentElement("BeforeEnd",label);
            container.insertAdjacentElement("BeforeEnd",input);
            input.innerHTML = '<label id=value>helloworld</label>';
        }
    }

    Setproperty(name, value)
    {
        //some heavy validation due to this being a outfacing function to the user
        let prop = this.props[name]; //hold the prop here
        //global validation
        if(prop === undefined || prop.length < 1 ) //dont allow new properties to exist
            {console.error("This property does not exist"); return;}
        
        //handle min/max/value style properties
        if(typeof value != "Array") { 
            value = parseFloat(value);
            this.props[name][1] = Math.min(Math.max(value, prop[0]),prop[2]); //clamp to the defined min/max
            return; //escape here
        }
        //else
        //handle range values sets
        if(this.prop.length && this.prop.length > value.length) // make sure that value has same length. Keep in mind props.length means that it is defined. Do to some objects being of type Array
            {console.error("Length does not match correct value length. Make sure you have a correctly formated Array"); return;}
        value.length = this.prop.length; // make sure to chop array to the correct size;
        value = value.map(x=> parseFloat(x)); //make sure to format all of these as float types ;
        this.prop = value; //once we done we can finalize it
        return;
    }

    CheckActive()
    {
        return this.container.className == "active"; //check to see if this object is rendering (if not then we move on)
    }

    GenerateMap()
    {
        throw new Error('You have to implement the method doSomething!');
    }
}

class CanvasManger
{
    canvases = []; //of canvas targets
    /* static */ Interval = null; // set this here so we basically can make this a singlton
    constructor()
    {
        if(this.Interval) return; //kill any objects pass the first object we create
        this.Interval = setInterval(()=> this.main(), 20); //set up our main loop
    }
    AddCanvas(CT) { //of type Canvas Target
        if(!typeof CT == CanvasTarget) return;
        this.canvases.push(CT);
    }
    main() // main loop
    {
        this.canvases.forEach(x => {
            if(x.CheckActive()) {x.active = true; x.GenerateMap();}
            else if(x.active) {x.active = false; x.camera.deactivate();}
        }); 
    }
}; var CanvasMgr = new CanvasManger(); CanvasManger = null; //keep in mind this is a forced singleton

