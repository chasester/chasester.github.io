var DungeonRenderer= 
{
    canvas: null,
    init(canvas)
    {
        this.canvas = canvas;
    },
    render(graph, camera)
    {
        if(!this.canvas) return;
        var ctx = this.canvas.getContext('2d');
        let minsize = graph.cellSize;
        let map = graph.map;
        //step one clear the buff
        //reset the buffer to black
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'black';
        ctx.fill();
        //add fancy border
        ctx.strokeStyle = '#888';
        ctx.stroke;
        //console.log(minsize);
        if(!map || !camera) return;
        let cammatix = camera.cammatix; //get our basic projection matrix variables

        //set up the bounds based on the projection;
        let bounds = new Rect(cammatix.position.x, cammatix.position.y,(cammatix.position.x + this.canvas.width)/cammatix.zoom, (cammatix.position.y + this.canvas.height)/cammatix.zoom);
    
        let size = minsize*cammatix.zoom;
        //dxi dyi becomes the number of tiles accross
        let dxi = Math.ceil(bounds.width()/minsize) +1; //width is relitive to 1 zoom so we can div by the smallest size tiles are allowed to be ie base size
        let dyi = Math.ceil(bounds.height()/minsize)+1; //same in other axis

        //ix iy becomes the starting indices of the array
        let ix = Math.floor(bounds.minX/minsize);
        let iy = Math.floor(bounds.minY/minsize);

        let x,y; //index x and y for final output

        //console.log(dxi, dyi);

        //remember rending always goes top right and y then x 
        for(let cy = 0; cy < dyi; cy++) //y is the index number we are on based on y*minsize + offset of camera
        {
            for(let cx = 0; cx < dxi; cx++) //same but in the x
            {
                x = cx+ix, y = cy+iy;
                ctx.beginPath();
                ctx.rect(x*size - bounds.minX, y*size - bounds.minY, size, size); //start vector, size vector
                //js is a little wierd rather than erroring out when going out of bounds in an array it instead returns undefined
                
                if(map[y] === undefined || map[y][x] === undefined) ctx.fillStyle = "yellow"
                else ctx.fillStyle = this.getFillStyle(map[y][x],x,y);
                ctx.fill();
            }
        }
    },
    getFillStyle(i)
    {
        let c = random.hash(i.id); //proboably a bit shift would be better
        return `rgb(${c*255},${c*255},${c*255})`;
    }
}