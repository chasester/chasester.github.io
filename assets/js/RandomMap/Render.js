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
        //this.prerender();
        setTimeout(() => { //roll this into a time out to push this down the event stack and be ran on the next event loop frame.
            this.randomSites(1000,true);
            this.render();
        }, 10);
        },

    prerender: function() //allows use of a quick loading text
    {
        var ctx = this.canvas.getContext("2d");
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.font = "50px Arial";
        ctx.fillText("Loading...",this.canvas.width/2,this.canvas.height/2);
        },
    clearSites: function() {
        this.sites = [];
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        this.updateStats();
        },

    randomSites: function(n,clear) {
        if (clear) {this.sites = [];}
        // create vertices
        var xmargin = this.canvas.width*this.margin,
            ymargin = this.canvas.height*this.margin,
            xo = xmargin,
            dx = this.canvas.width-xmargin*2,
            yo = ymargin,
            dy = this.canvas.height-ymargin*2;
        for (var i=0; i<n; i++) {
            this.sites.push({
                x: xo + Math.random()*dx + Math.random()/dx,
                y: yo + Math.random()*dy + Math.random()/dy
                });
            }
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        this.updateStats();
        },

    recompute: function() {
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        this.updateStats();
        },

    updateStats: function() {
        if (!this.diagram) {return;}
        var e = document.getElementById('voronoiStats');
        if (!e) {return;}
        e.innerHTML = '('+this.diagram.cells.length+' Voronoi cells computed from '+this.diagram.cells.length+' Voronoi sites in '+this.diagram.execTime+' ms &ndash; rendering <i>not</i> included)';
        },

    render: function(diagram) {
        var ctx = this.canvas.getContext('2d');
        // background
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        // voronoi
        if (!diagram) {console.log("hello");return;}
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
        ctx.fillStyle = "Red"; /* 'rgb('+
        Math.floor(Math.random()*256)+','+ //r
        Math.floor(Math.random()*256)+','+ //g
        Math.floor(Math.random()*256)+')'; //b */
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
        ctx.fill();
        },
        
        renderCell: function(cell, fillStyle) {
            if (!cell) {return;}
            var ctx = this.canvas.getContext('2d');
            ctx.globalAlpha = 1;
            // edges
            ctx.beginPath();
            var halfedges = cell.halfedges,
                nHalfedges = halfedges.length,
                v = halfedges[0].getStartpoint();
            ctx.moveTo(v.x,v.y);
            for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
                v = halfedges[iHalfedge].getEndpoint();
                ctx.lineTo(v.x,v.y);
                }
            ctx.fillStyle = fillStyle;
            //ctx.strokeStyle = strokeStyle;
            ctx.fill();
            //ctx.stroke();
            // site
            v = cell.site;
            ctx.fillStyle = '#44f';
            ctx.beginPath();
            ctx.rect(v.x-2/3,v.y-2/3,2,2);
            ctx.fill();
        },
    };
//RandomMapRender.init();
rndContainor = document.querySelector("#RandomMap")