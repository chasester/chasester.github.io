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
}; var CanvasMgr = new CanvasManger(); //keep in mind this is a forced singleton

//Fix for the Resume button transition effect
var ResumeSelector = document.querySelector("article#resume");
var ResumeActivating = false;

// this get the user back to the home screen but if using this to open the window will cause a popup block notification
setInterval(()=>
{
    if(ResumeSelector.className === "active" && !ResumeActivating)
    {
        setTimeout(()=>{
            //ResumeActivating = false;
            window.open("#", "_self"); //send back to main menu
            winopen = window.open("https://resume.creddle.io/resume/5xk25r0nreq", "_blank"); // send to external link
            if (window.focus) {winopen.unfocus()}
            winopen.unfocus();
        }, 40);
    }
}, 20);

//alt verison that doesnt trigger popup notifification on some chromium browsers. But doesnt return user back to main menu as expected.
/* var DelayFocus = (url) => {
    
    setTimeout(()=>{
        ResumeActivating = true;
        currwindow = window;
        setTimeout(()=> {
            urlTimer = setInterval(()=>
                {
                    $main._hide();
                }, 5)
            //currwindow.open("#", "_self"); //send back to main menu
            winopen = window.open(url, "_blank"); // send to external link
            if (window.focus) {winopen.focus()}
        }, 50)
    }, 400)
    }  */