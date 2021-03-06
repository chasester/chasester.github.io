/*
Copyright (C) 2010-2013 Raymond Hill
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md

Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
Version: 0.98
Date: January 21, 2013
Description: This is my personal Javascript implementation of
Steven Fortune's algorithm to compute Voronoi diagrams.

License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md
*/

/*
 * Random Continental map version by Chase Wenner
 * Used as is with Heavy modifications
 * 
 * Permission to use, copy, modify, and distribute this software for any
 * purpose without fee is hereby granted, provided that this entire notice
 * is included in all copies of any software which is or includes a copy
 * or modification of this software and in all copies of the supporting
 * documentation for such software.
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, NEITHER THE AUTHORS NOR AT&T MAKE ANY
 * REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
*/


var RandomMapRender = {
    canvas: null,
    bbox: {xl:0,xr:800,yt:0,yb:600},

    init: function(canvas) {
        this.canvas = canvas
        this.prerender();
        },

    prerender: function() //allows use of a quick loading text
    {
        var ctx = this.canvas.getContext("2d");
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.font = "50px Arial";
        ctx.fillText("Loading...",this.canvas.width/2,this.canvas.height/2);
        },
    renderStatus(ctx,status)
    {
        ctx.textAlign = "start";
        ctx.font = "30px Georgia";
        ctx.fillStyle = "white";
        ctx.fillText(status + "...", 10,this.canvas.height-20)
    },
    render: function(diagram, camera,status) {
        //old render using voronoi.js class functions
        {/* var ctx = this.canvas.getContext('2d');
        // background
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        // voronoi
        if (!diagram) {return;}
        // edges
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        var edges = diagram.edges,
            iEdge = edges.length,
            edge, v;
        while (iEdge--) {
            edge = edges[iEdge];
            v = edge.va;
            ctx.moveTo(v.x,v.y);
            v = edge.vb;
            ctx.lineTo(v.x,v.y);
            }
        ctx.stroke();
        // edges
        ctx.beginPath();
        ctx.fillStyle = "Red"; 
        var vertices = diagram.vertices,
            iVertex = vertices.length;
        while (iVertex--) {
            v = vertices[iVertex];
            ctx.rect(v.x-1,v.y-1,3,3);
            }
        ctx.fill();
        // sites
       ctx.beginPath();
         ctx.fillStyle = '#44f';
        var sites = diagram.cells,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
            this.renderCell(
                v,
             'rgb('+
                Math.floor(random.hash(v.site.voronoiId)*256)+','+ //r
                Math.floor(random.hash( v.site.voronoiId >> 3)*256)+','+ //g
                Math.floor(random.hash( v.site.voronoiId >> 6)*256)+')' //b
            );
            }
        ctx.fill(); */}

        var ctx = this.canvas.getContext('2d');
        //step one clear the buffer
        // background reset the buffer with the base color to clear the screen
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'black';
        ctx.fill();
        //adds fancy border
        ctx.strokeStyle = '#888';
        ctx.stroke();
        
        //step two do validation
        //validate that we have data to render
        if(!diagram) {this.renderStatus(status); return;} // this below function will use data as form from utils instead of voronio (above renders from voronoi data)
        let setting = {showcorners: false, showedges: false, showsites: false, showNeighbors: false} //this will be replaced by a paramater
        let cammatix = camera.cammatix;/*  {
            position: new Vec2(0,0), //upper Left corner of the camera;
            zoom: 1, //scale of the map 0.1 means everything is 1/10 the scale and 10 means that everything is 10 times as big
            //rotation: {x1,x2,x3,  y1,y2,y3,  z1,z2,z3} //maybe add this
        } */
        //bounds is our basic box which the camera is viewing currently, dont send things to the contex render if they arnt visible
        let bounds = new Rect(cammatix.position.x, cammatix.position.y,(cammatix.position.x + this.canvas.width)/cammatix.zoom, (cammatix.position.y + this.canvas.height)/cammatix.zoom);

        let len = diagram.cells.length, arr = diagram.cells, x,v, flag = setting.showsites,
        o = new Vec2(-bounds.minX,-bounds.minY), z = new Vec2(cammatix.zoom, cammatix.zoom); //passing in negative so an add is a sub
        while(len--) // for each edge we will draw a triangle to->from->center this is due to our edges not knowing what order they connect in
        {
            x = arr[len];
            let h = random.hash(x.id);
            let color = this.getFillStyle(x);
            if(!bounds.check(x.center)) continue; //if not in the bounds then dont add to contex
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            x.borders.forEach(e => {
                v = o.add(e.ends[0].position).mul(z);
                ctx.moveTo(v.x,v.y)
                v = o.add(e.ends[1].position).mul(z);
                ctx.lineTo(v.x,v.y);
                v = o.add(x.center).mul(z);
                ctx.lineTo(v.x,v.y);
                
            });
            ctx.fill(); 
            ctx.stroke(); //do stroke so that we get fully filled shapes with no antialising
            if(flag)
            {
                v = o.add(x.center).mul(z);
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.rect(v.x-2/3,v.y-2/3,2,2);
                ctx.fill();
            }
        }
        
        
        if(setting.showedges )
        {
            len = diagram.edges.length, arr = diagram.edges;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            while(len--)
            {
                x = arr[len].ends[0].position;
                v = arr[len].ends[1].position;
                if(!bounds.check(x) && !bounds.check(v)) continue; //only skip if both ends are not visible;
                x = o.add(x).mul(z);
                v = o.add(v).mul(z);
                ctx.moveTo(x.x, x.y);
                ctx.lineTo(v.x, v.y);
            }
            ctx.stroke();
        }
         if(setting.showcorners)
        {
            len = diagram.corners.length, arr = diagram.corners, x;
            let c;
            while(len--)
            {
                c = arr[len];
                ctx.fillStyle = c.terrain == TerrainType.LAND ? "green" : TerrainType.OCEAN  == c.terrain ? "blue" : TerrainType.COAST == c.terrain ? "yellow" : "black";
                ctx.beginPath();
                v = o.add(arr[len].position).mul(z);
                ctx.rect(v.x-2/3,v.y-2/3,2,2);
                ctx.fill();
            }
            
        }
        if(setting.showNeighbors)
        {
            len = diagram.cells.length, arr = diagram.cells;
            let v1;
            ctx.strokeStyle = "black";
            while(len--){
                x = arr[len];
                v1 = o.add(x.center).mul(z);
                x.neighbors.forEach(n=>
                {
                    if(n.id == -1) return;
                    ctx.moveTo(v1.x,v1.y);
                    v = o.add(n.center).mul(z);
                    ctx.lineTo(v.x,v.y);
                })
            }
            ctx.stroke();
        }
        this.renderStatus(ctx,status);
        },
        getFillStyle(c){//will determine cell color by biome and elevation data
            let r,d;
            switch(c.terrainType){
                case TerrainType.NONE:
                    r = c.elevation < 0 || isNaN(c.elevation) ?  random.hash(Math.floor(c.center.x/5)*Math.floor(c.center.y/5))*50+85 : c.elevation > 0.35 ? c.elevation*170 : c.elevation*100;
                    return `rgb(${r},${r},${r})`
                case TerrainType.LAND:
                    r = c.elevation;
                    d = {r: 147, g: 230, b: 151}
                    return `rgb(${d.r*r},${d.g*r},${d.b*r})`
                case TerrainType.OCEAN:
                    r = (c.elevation*1.3)+0.3;
                    d = {r: 77, g: 89, b: 214}
                    return `rgb(${d.r*r},${d.g*r},${d.b*r})`
                case TerrainType.COAST:
                    r = Math.min((c.elevation*0.25)+0.9, 1);
                    d = {r: 255, g: 226, b: 168}
                    return `rgb(${d.r*r},${d.g*r},${d.b*r})`
                default:
                    return "rgb(0,0,0)";
            }
        }
    };