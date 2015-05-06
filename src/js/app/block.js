'use strict';

var project = require('./_project');

var _         = require('underscore');
var THREE     = require('three');
var Dat       = require('dat-gui');
var Chance    = require('chance');
var models    = require('../models');
var queue     = require('../util/queue');

var Block     = require('../generators/block');
var Building  = require('../generators/building');

global.Block = Block;
global.Building = Building;

var chance = new Chance();

var blockGroup = new THREE.Group();
project.scene.add(blockGroup);

models.load(function() {

  Building.setModels(_.mapObject(models.cache, function(model) {
    return model.toJSON();
  }));

  var block = {
    options: Block.templates.standard,
    points: [],

    _randomPolygon: function() {
      var chance;

      if(block.options.seed) {
        chance = new Chance(block.options.seed);
      }
      else {
        chance = new Chance();
      }

      var angles = [];
      var radius = chance.floating({ min: 20, max: 50 });
      var n = chance.integer({ min: 3, max: 8 });
      var i;

      block.points = [];

      for(i = 0; i < n; i++) {
        angles.push(chance.floating({ min: 0, max: Math.PI * 2 }));
      }

      angles = angles.sort().reverse();

      for(i = 0; i < n; i++) {
        var angle = angles[i];

        var x = radius * Math.cos(angle);
        var y = radius * Math.sin(angle);
        block.points.push([x, y]);
      }
    },

    randomSeed: function() {
      block.options.seed = Math.round(Math.random() * 10000);
    },

    generate: function() {
      block._randomPolygon();
      blockGroup.remove.apply(blockGroup, blockGroup.children);

      var group = Block.generate(block.points, block.options);

      blockGroup.add(group);

    } 
  };


  var gui = new Dat.GUI();
  gui.add(block.options, 'squareSize').min(1).max(10).step(1);
  gui.add(block.options, 'depth').min(1).max(25).step(1);

  gui.add(block.options, 'seed').min(0).max(10000).step(1).listen();

  gui.add(block.options, 'debugPolygon');
  gui.add(block.options, 'debugGrid');
  gui.add(block.options, 'debugSections');

  gui.add(block, 'randomSeed');
  gui.add(block, 'generate');
});

project.start();