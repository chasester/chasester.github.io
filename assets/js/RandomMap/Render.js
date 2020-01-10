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
 * Used as is with small modifications
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
    margin: 0.15,
    canvas: null,
    bbox: {xl:0,xr:800,yt:0,yb:600},
    benchmarkTimer: null,
    benchmarkTimes: new Array(50),
    benchmarkPointer: 0,
    benchmarkMaxSites: 100,

    init: function() {
        this.canvas = document.getElementById('RandomMapCanvas');
        this.randomSites(100,true);
        this.render();
        },

    benchmarkToggle: function() {
        if ( this.benchmarkTimer ) {
            this.benchmarkStop();
            }
        else {
            this.benchmarkStart();
            }
        },

    benchmarkStart: function() {
        this.benchmarkMaxSites = Math.floor(parseFloat(document.getElementById('voronoiNumberSites').value));
        this.benchmarkPointer = 0;
        this.benchmarkTimer = setTimeout(this.benchmarkDo, 250);
        document.getElementById('voronoiBenchmark').value = 'Stop';
        },

    benchmarkDo: function() {
        var vd = VoronoiDemo;
        vd.randomSites(vd.benchmarkMaxSites, true);
        vd.render();
        vd.benchmarkTimes[vd.benchmarkPointer] = vd.diagram.execTime;
        vd.benchmarkPointer++;
        if ( vd.benchmarkPointer < vd.benchmarkTimes.length ) {
            document.getElementById('benchmarkResult').innerHTML = new Array(vd.benchmarkTimes.length-vd.benchmarkPointer+1).join('.');
            vd.benchmarkTimer = setTimeout(vd.benchmarkDo, 250);
            }
        else {
            vd.benchmarkStop();
            }
        },

    benchmarkStop: function() {
        if ( this.benchmarkTimer ) {
            clearTimeout(this.benchmarkTimer);
            this.benchmarkTimer = null;
            }
        var sum = 0;
        var fastest = Number.MAX_VALUE;
        var slowest = -Number.MAX_VALUE;
        this.benchmarkTimes.map(function(v){
            sum += v;
            fastest = Math.min(v, fastest);
            slowest = Math.max(v, slowest);
            });
        sum -= fastest;
        sum -= slowest;
        var avg = sum / (this.benchmarkPointer-2);
        document.getElementById('benchmarkResult').innerHTML =
            'average exec time for ' +
            this.benchmarkMaxSites +
            ' sites = ' +
            avg.toFixed(1) + ' ms ' +
            ' (' + (avg*1000/this.benchmarkMaxSites).toFixed(1) + ' µs/site)' +
            ', fastest = ' + fastest + ' ms, slowest = ' + slowest + ' ms.'
            ;
        document.getElementById('voronoiBenchmark').value = 'Benchmark';
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

    render: function() {
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
        if (!this.diagram) {return;}
        // edges
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        var edges = this.diagram.edges,
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
        ctx.fillStyle = 'red';
        var vertices = this.diagram.vertices,
            iVertex = vertices.length;
        while (iVertex--) {
            v = vertices[iVertex];
            ctx.rect(v.x-1,v.y-1,3,3);
            }
        ctx.fill();
        // sites
        ctx.beginPath();
        ctx.fillStyle = '#44f';
        var sites = this.sites,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
            ctx.rect(v.x-2/3,v.y-2/3,2,2);
            }
        ctx.fill();
        },
        
        renderCell: function(id, fillStyle, strokeStyle) {
            if (id === undefined) {return;}
            if (!this.diagram) {return;}
            var cell = this.diagram.cells[id];
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
            ctx.strokeStyle = strokeStyle;
            ctx.fill();
            ctx.stroke();
            // site
            v = cell.site;
            ctx.fillStyle = '#44f';
            ctx.beginPath();
            ctx.rect(v.x-2/3,v.y-2/3,2,2);
            ctx.fill();
        },
    };
    RandomMapRender.init();