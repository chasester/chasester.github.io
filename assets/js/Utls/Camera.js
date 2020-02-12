class Camera //maybe remove the key events and move to new class if we have a more complex layout.
{
    constructor(target)
    {
        this.events = 
        {
            keyboard: null,
            mouse: null
        }
        //check if the object was given proper value
        if(!target || !target instanceof HTMLCanvasElement) console.log("non canvas object given")
        
        this.target = target;
        this.cammatix =
        {
            position: new Vec2(0,0), //upper Left corner of the camera;
            zoom: 1, //scale of the map 0.1 means everything is 1/10 the scale and 10 means that everything is 10 times as big
            //rotation: {x1,x2,x3,  y1,y2,y3,  z1,z2,z3} //maybe add this
        }
        this.setup();
    }
    setup()
    {
        if(!this.target);
        //set up helper functions
        
        this.target.requestPointerLock = this.target.requestPointerLock ||
                            this.target.mozRequestPointerLock;

        document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;
        
        this.target.onclick = () => {
            this.target.requestPointerLock();
        };
        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', this.lockChangeAlert, false);
    }
    lockChangeAlert = () =>
    {
        if(document.pointerLockElement === this.target || document.mozPointerLockElement === this.target)//clicked inside
        {
            //create event listeners
            document.addEventListener("mousemove", this.handleCapture);
            document.addEventListener("keydown", this.handleKeyDown);
        } else //clicked out side or asked to be removed
        {
            document.removeEventListener("mousemove", this.handleCapture, false);
            document.removeEventListener("keydown", this.handleKeyDown, false);
        }
    }
    handleCapture = () =>
    {

    }
    handleKeyDown = (e) =>
    {
        const keys = {
            Q: 81,
            W: 87,
            E: 69,
            A: 65,
            S: 83,
            D: 68
        }

        switch(e.keyCode)
        {
            //zoom
            case keys.E:
                this.cammatix.zoom -= this.cammatix.zoom > 1 ? !e.shiftKey  ? 0.1 : 1  : 0;
                this.cammatix.zoom = Math.max(this.cammatix.zoom, 1);
                break;
            case keys.Q:
                this.cammatix.zoom += this.cammatix.zoom < 20 ? !e.shiftKey  ? 0.1 : 1 : 0.5;
                this.cammatix.zoom = Math.min(this.cammatix.zoom, 20);
                break;

            //movement
            case keys.W:
                this.cammatix.position.y -= !e.shiftKey  ? 1 : 20;
                break;
            case keys.A:
                this.cammatix.position.x -= !e.shiftKey  ?1 : 20;
                break;
            case keys.S:
                this.cammatix.position.y += !e.shiftKey  ? 1 : 20;
                break;
            case keys.D:
                this.cammatix.position.x += !e.shiftKey  ? 1 : 20;
                break;
        }

    }
    deactivate() //called when the canvas is no longer the active window
    {
        if(!this.target) return;
        //remove all of the event listeners
        document.removeEventListener("mousemove", this.handleCapture, false);
        document.removeEventListener("keydown", this.handleKeyDown, false);
    }
}