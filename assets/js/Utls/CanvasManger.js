class CanvasTarget
{
    constructor(container, canvas)
    {
        this.container = container;
        this.canvas = canvas;
        this.camera = new Camera(this.canvas);
        this.active = false;
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
    static Interval = null; // set this here so we basically can make this a singlton
    constructor()
    {
        if(CanvasManger.Interval) return; //kill any objects pass the first object we create
        CanvasManger.Interval = setInterval(()=> this.main(), 20); //set up our main loop
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
}; var CanvasMgr = new CanvasManger(); //keep in mind this is a forced singleton

