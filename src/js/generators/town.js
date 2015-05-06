'use strict';

var _       = require('underscore');
var Block   = require('./block');
var Voronoi = require('voronoi');
var Polygon = require('polygon');
var Chance  = require('chance');
var THREE   = require('three');

var templates = {
  standard: {
    width: 200,
    depth: 200,
    blocks: 10,

    seed: 0,

    block: Block.templates.standard
  }
};

var chance;

var Town = {
  templates: templates,

  generate: function(options, callback) {
    var settings = {};
    var group = new THREE.Group();

    settings = _.extend({}, templates.standard, _.omit(options, 'block'));
    settings.block = _.extend({}, Block.templates.standard, options.block);
    settings.block.seed = settings.seed;

    callback = callback || _.noop;

    if(settings.seed) {
      chance = new Chance(settings.seed);
    }
    else {
      chance = new Chance();
    }

    var voronoi = Town._getVoronoi(settings);
    var polygons = Town._getPolygons(settings, voronoi);
    
    for(var i = 0; i < polygons.length; i++) {
      var polygon = polygons[i];

      var block = Block.generate(polygon.toArray(), settings.block);
      group.add(block);
    }

    return group;
  },

  _getVoronoi: function(settings) {
    var voronoi = new Voronoi();
    
    var bbox = { 
      xl: settings.width / -2,
      xr: settings.width / 2,
      yt: settings.depth / -2,
      yb: settings.depth / 2
    };
    var sites = [];

    for(var i = 0; i < settings.blocks; i++) {
      var x = chance.integer({ min: bbox.xl, max: bbox.xr });
      var y = chance.integer({ min: bbox.yt, max: bbox.yb });

      sites.push({ x: x, y: y });
    }

    return voronoi.compute(sites, bbox);
  },

  _getPolygons: function(settings, voronoi) {
    var polygons = [];

    for(var i = 0; i < voronoi.cells.length; i++) {
      var cell = voronoi.cells[i];
      var points = [];

      for(var j = 0; j < cell.halfedges.length; j++) {
        var halfedge = cell.halfedges[j];
        
        points.push(halfedge.getStartpoint());
      }

      var polygon = new Polygon(points);
      polygon = polygon.offset(-3);
      polygon.rewind(true);
      polygons.push(polygon);
    }

    return polygons;
  }
};

module.exports = Town;