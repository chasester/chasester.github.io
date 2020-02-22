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
        let branches = graph.branches;
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
        let ix = Math.floor(bounds.minX/size);
        let iy = Math.floor(bounds.minY/size);

        let x,y; //index x and y for final output

        //console.log(dxi, dyi);
        for(y = 0, leny = map.length; y < leny; y++)
        {
            for(x = 0, lenx = map[0].length; x < lenx; x++)
            {
                px = (x*size - bounds.minX); py = (y*size - bounds.minY)
                if(px < -size || py < -size || px > this.canvas.width+size || py > this.canvas.height+size) continue; //using brute force as below method was not working due to bounds being incorrect
                ctx.beginPath();
                ctx.rect(px, py, size, size); //start vector, size vector
                if(map[y] === undefined || map[y][x] === undefined) ctx.fillStyle = "Black"
                else ctx.fillStyle = this.getFillStyle(map[y][x],x,y);
                ctx.fill();
            }
        }
        //remember rending always goes top right and y then x 
        /* for(let cy = 0; cy < dyi; cy++) //y is the index number we are on based on y*minsize + offset of camera
        {
            for(let cx = 0; cx < dxi; cx++) //same but in the x
            {
                x = cx+ix, y = cy+iy;
                ctx.beginPath();
                ctx.rect(x*size - bounds.minX, y*size - bounds.minY, size, size); //start vector, size vector
                //js is a little wierd rather than erroring out when going out of bounds in an array it instead returns undefined
                
                if(map[y] === undefined || map[y][x] === undefined) ctx.fillStyle = "Black"
                else ctx.fillStyle = this.getFillStyle(map[y][x],x,y);
                ctx.fill();
            }
        } */
        let b;
        for(let i = 0; i < branches.length; i++ )
        {
            b = branches[i];
            x = b.location.x;
            y = b.location.y;
            ctx.beginPath();
            ctx.rect(x*size - bounds.minX, y*size - bounds.minY, size, size);
            

            ctx.fillStyle = `rgb(${random.hash(b.id)*50+200},${random.hash(b.id<<2)*100},${random.hash(b.id<<1)*100})` ;
            ctx.fill();
        }

    },
    getFillStyle(i)
    {
        let c = random.hash(i.id); //proboably a bit shift would be better
        switch(i.type)
        {
            case TileTYPE.None:           
                return `rgb(${c*5},${c*5},${c*5})`;
            case TileTYPE.Wall: 
                return `rgb(${c*20+50},${c*20+50},${c*20+50})`
            case TileTYPE.Floor:
                return `rgb(${c*20+100},${c*20+100},${c*20+100})`
            default:
                return "yellow";
        }
        
    }
}