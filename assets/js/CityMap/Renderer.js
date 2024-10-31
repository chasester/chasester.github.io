var CityRender = 
{
    canvas: null,
    init(canvas)
    {
        this.canvas = canvas;
        this.clearCanvas();
    },
    render(graph, camera)
    {
        this.clearCanvas();
    },

    clearCanvas()
    {
         if(!this.canvas) return false;
        let ctx = this.canvas.getContext('2d');
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'green';
        ctx.fill();
    }
}