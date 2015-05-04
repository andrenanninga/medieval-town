'use strict';

var project = require('./_project');

var _         = require('underscore');
var THREE     = require('three');
var Dat       = require('dat-gui');
var models    = require('../models');
var queue     = require('../util/queue');

var Building  = require('../generators/building');
var Block     = require('../generators/block');

global.Block = Block;
global.Building = Building;

var buildingGroup = new THREE.Group();
project.scene.add(buildingGroup);

models.load(function() {

  Building.setModels(_.mapObject(models.cache, function(model) {
    return model.toJSON();
  }));

  var building = {
    options: Building.templates.standard,

    randomSeed: function() {
      building.options.seed = Math.round(Math.random() * 10000);
    },

    generate: function() {
      buildingGroup.remove.apply(buildingGroup, buildingGroup.children);

      var func = _.bind(function(cb) {
        Building.generate(building.options, function(err, mesh) {
          buildingGroup.add(mesh);

          cb();
        });
      }, this);

      queue.push(func);

    } 
  };

  var gui = new Dat.GUI();
  gui.add(building.options, 'amplitude').min(0.02).max(1).step(0.02);
  gui.add(building.options, 'frequency').min(0.02).max(1).step(0.02);
  gui.add(building.options, 'octaves').min(1).max(64).step(1);
  gui.add(building.options, 'persistence').min(0).max(1);
  gui.add(building.options, 'heightDampener').min(0).max(1);
  
  gui.add(building.options, 'width').min(1).max(15).step(1);
  gui.add(building.options, 'height').min(1).max(15).step(1);
  gui.add(building.options, 'depth').min(1).max(15).step(1);

  gui.add(building.options, 'solidChance').min(0).max(1);
  gui.add(building.options, 'roofPointChance').min(0).max(1);
  gui.add(building.options, 'wallDoorChance').min(0).max(1);
  gui.add(building.options, 'wallWindowChance').min(0).max(1);
  gui.add(building.options, 'bannerChance').min(0).max(1);
  gui.add(building.options, 'shieldChance').min(0).max(1);
  gui.add(building.options, 'fenceChance').min(0).max(1);

  gui.add(building.options, 'seed').min(0).max(10000).step(1).listen();

  gui.add(building.options, 'debug');

  gui.add(building, 'randomSeed');
  gui.add(building, 'generate');
});

project.start();