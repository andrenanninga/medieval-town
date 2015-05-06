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

  gui.add(town.options.block, 'debugPolygon');
  gui.add(town.options.block, 'debugGrid');
  gui.add(town.options.block, 'debugSections');

  gui.add(town, 'randomSeed');
  gui.add(town, 'generate');
});

project.start();