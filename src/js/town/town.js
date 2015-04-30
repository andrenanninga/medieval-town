'use strict';

var _          = require('underscore');
var THREE      = require('three');
var Chance     = require('chance');
var Voronoi    = require('voronoi');
var Polygon    = require('polygon');
var seedrandom = require('seedrandom');

var Block      = require('./block');

var chance = new Chance();

var Town = function(parent, width, depth) {
  this.parent = parent;

  this.width = width;
  this.depth = depth;

  this.seed = 0;
  this.randomSeed();

  this.group = new THREE.Group();
  this.debug = new THREE.Group();
};

Town.prototype.generate = function() {
  console.time('town.generate');
  this.seed = Date.now();
  this.rng = seedrandom(this.seed);
  chance.random = this.rng;

  this.voronoi = new Voronoi();
  var bbox = {xl: -50, xr: 50, yt: -50, yb: 50 };
  var sites = [];

  for(var i = 0; i < 15; i++) {
    var x = chance.integer({ min: -50, max: 50 });
    var y = chance.integer({ min: -50, max: 50 });

    sites.push({ x: x, y: y });
  }

  this.diagram = this.voronoi.compute(sites, bbox);
  console.log(this.diagram);

  for(var i = 0; i < this.diagram.cells.length; i++) {
    var cell = this.diagram.cells[i];
    var points = [];

    for(var j = 0; j < cell.halfedges.length; j++) {
      var halfedge = cell.halfedges[j];

      points.push(halfedge.getStartpoint());
    }

    var polygon = new Polygon(points);
    polygon = polygon.offset(-3);
    polygon.rewind(true);

    if(polygon.area() > 250) {
      var block = new Block(this.group, _.invoke(polygon.points, 'toArray'));
      block.generate();
    }
  }

  this.parent.add(this.group);
  console.timeEnd('town.generate');

};

Town.prototype.randomSeed = function() {
  this.seed = Math.round(Math.random() * 10000);
};

Town.prototype.generateRandomSeed = function() {
  this.randomSeed();
  this.generate();
};

module.exports = Town;