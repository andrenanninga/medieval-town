'use strict';

var project = require('./_project');

var _         = require('underscore');
var THREE     = require('three');
var Dat       = require('dat-gui');
var Chance    = require('chance');
var models    = require('../models');
var queue     = require('../util/queue');

var Building  = require('../generators/building');
var Town      = require('../generators/town');

global.Town = Town;

var chance = new Chance();

var townGroup = new THREE.Group();
project.scene.add(townGroup);

models.load(function() {

  Building.setModels(_.mapObject(models.cache, function(model) {
    return model.toJSON();
  }));

  var town = {
    options: Town.templates.standard,
    points: [],

    randomSeed: function() {
      town.options.seed = Math.round(Math.random() * 10000);
    },

    generate: function() {
      townGroup.remove.apply(townGroup, townGroup.children);

      var group = Town.generate(town.options);

      townGroup.add(group);

    } 
  };


  var gui = new Dat.GUI();
  gui.add(town.options, 'width').min(10).max(250).step(1);
  gui.add(town.options, 'depth').min(10).max(250).step(1);
  gui.add(town.options, 'blocks').min(1).max(40).step(1);

  gui.add(town.options, 'seed').min(0).max(10000).step(1).listen();

  var blockFolder = gui.addFolder('Block');
  blockFolder.add(town.options.block, 'squareSize').min(1).max(10).step(1);
  blockFolder.add(town.options.block, 'depth').min(1).max(25).step(1);

  blockFolder.add(town.options.block, 'seed').min(0).max(10000).step(1).listen();

  blockFolder.add(town.options.block, 'debugPolygon');
  blockFolder.add(town.options.block, 'debugGrid');
  blockFolder.add(town.options.block, 'debugSections');

  var buildingFolder = gui.addFolder('Building');
  buildingFolder.add(town.options.block.building, 'amplitude').min(0.02).max(1).step(0.02);
  buildingFolder.add(town.options.block.building, 'frequency').min(0.02).max(1).step(0.02);
  buildingFolder.add(town.options.block.building, 'octaves').min(1).max(64).step(1);
  buildingFolder.add(town.options.block.building, 'persistence').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'heightDampener').min(0).max(1);
  
  buildingFolder.add(town.options.block.building, 'height').min(1).max(15).step(1);

  buildingFolder.add(town.options.block.building, 'solidChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'roofPointChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'wallDoorChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'wallWindowChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'bannerChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'shieldChance').min(0).max(1);
  buildingFolder.add(town.options.block.building, 'fenceChance').min(0).max(1);

  buildingFolder.add(town.options.block.building, 'debug');

  gui.add(town, 'randomSeed');
  gui.add(town, 'generate');
});

project.start();