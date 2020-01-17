/*
Copyright (C) 2010-2013 Raymond Hill
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md

Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
File: rhill-voronoi-core.js
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
    voronoi: new Voronoi(),
    sites: [],
    diagram: null,
    margin: 0.001,
    canvas: null,
    bbox: {xl:0,xr:800,yt:0,yb:600},
    benchmarkTimer: null,
    benchmarkTimes: new Array(50),
    benchmarkPointer: 0,
    benchmarkMaxSites: 100,

    init: function(canvas) {
        this.canvas = canvas
        this.prerender();
        },

    prerender: function() //allows use of a quick loading text
    {
        var ctx = this.canvas.getContext("2d");
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.font = "50px Arial";
        ctx.fillText("Loading...",this.canvas.width/2,this.canvas.height/2);
        },

    updateStats: function() {
        if (!this.diagram) {return;}
        var e = document.getElementById('voronoiStats');
        if (!e) {return;}
        e.innerHTML = '('+this.diagram.cells.length+' Voronoi cells computed from '+this.diagram.cells.length+' Voronoi sites in '+this.diagram.execTime+' ms &ndash; rendering <i>not</i> included)';
        },

    render: function(diagram) {
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
        ctx.globalAlpha = 1;
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
        if(!diagram) return // this below function will use data as form from utils instead of voronio (above renders from voronoi data)
        let setting = {showcorners: false, showedges: false, showsites: true, showNeighbors: true} //this will be replaced by a paramater
        let cammatix = { 
            position: new Vec2(0,0), //upper Left corner of the camera;
            zoom: 1, //scale of the map 0.1 means everything is 1/10 the scale and 10 means that everything is 10 times as big
            //rotation: {x1,x2,x3,  y1,y2,y3,  z1,z2,z3} //maybe add this
        }
        //bounds is our basic box which the camera is viewing currently, dont send things to the contex render if they arnt visible
        let bounds = new Rect(cammatix.position.x, cammatix.position.y,cammatix.position.x + canvas.width, cammatix.position.y + canvas.height);

        let len = diagram.cells.length, arr = diagram.cells, x,v, flag = setting.showsites,o = new Vec2(-bounds.minX,-bounds.minY); //passing in negative so an add is a sub
        while(len--) // for each edge we will draw a triangle to->from->center this is due to our edges not knowing what order they connect in
        {
            x = arr[len];
            let h = random.hash(x.id);
            let color = this.getFillStyle(x);
            //if(!bounds.check(x.center)) continue; //if not in the bounds then dont add to contex
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            x.borders.forEach(e => {
                v = o.add(e.ends[0].position);
                ctx.moveTo(v.x,v.y);
                v = o.add(e.ends[1].position);
                ctx.lineTo(v.x,v.y);
                v = o.add(x.center);
                ctx.lineTo(v.x,v.y);
                
            });
            ctx.fill(); 
            ctx.stroke(); //do stroke so that we get fully filled shapes with no antialising
            if(flag)
            {
                v = o.add(x.center);
                ctx.fillStyle = '#44f';
                ctx.beginPath();
                ctx.rect(v.x-2/3,v.y-2/3,2,2);
                ctx.fill();
            }
            if(setting.showNeighbors)
            {
                ctx.strokeStyle = "black";
                let v1 = o.add(x.center);
                x.neighbors.forEach(x=>
                    {
                        ctx.moveTo(v1.x,v1.y);
                        v = o.add(x.center)
                        ctx.lineTo(v.x,v.y);
                    })
                    ctx.stroke();
                
            }
        }
        len = diagram.edges.length, arr = diagram.edges;
        ctx.strokeStyle = "White";
        if(setting.showedges )while(len--)
        {
            x = arr[len].ends[0].position;
            v = arr[len].ends[1].position;
            if(!bounds.check(x) && !bounds.check(v)) continue; //only skip if both ends are not visible;
            x = o.add(x);
            v = o.add(v);
            ctx.moveTo(x.x, x.y);
            ctx.lineTo(v.x, v.y);
        }
        ctx.stroke();
        ctx.fillStyle = "Black"
        len = diagram.corners.length, arr = diagram.corners, x;
        if(setting.showcorners)while(len--)
        {
            v = o.add(arr[len].position);
            ctx.beginPath();
            ctx.rect(v.x-2/3,v.y-2/3,2,2);
            ctx.fill();
        }  
        ctx.fill();
        },
        getFillStyle(c){//will determine cell color by biome and elevation data
            let r = random.hash(c.id)*50+185;
            return `rgb(${r},${r},${r})`
        }
    };
//RandomMapRender.init();
rndContainor = document.querySelector("#RandomMap")