'use strict';

var _          = require('underscore');
var THREE      = require('three');
var SAT        = require('sat');
var Chance     = require('chance');
var seedrandom = require('seedrandom');

var Block = require('./block');

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
  this.seed = Date.now();
  this.rng = seedrandom(this.seed);
  chance.random = this.rng;

  var n = function(min, max) {
    return chance.integer({ min: min, max: max });
  };

  this.group.remove.apply(this.group, this.group.children);
  this.debug.remove.apply(this.debug, this.debug.children);

  var points = [];
  points.push(new THREE.Vector3(n(10, 30), 0, n(10, 20)));
  points.push(new THREE.Vector3(n(10, 20), 0, n(-20, -10)));
  points.push(new THREE.Vector3(n(-20, -10), 0, n(-20, -10)));
  points.push(new THREE.Vector3(n(-20, -10), 0, n(10, 20)));

  var block = new Block(this.group, points);
  block.generate();

  this.parent.add(this.group);
};

Town.prototype.randomSeed = function() {
  this.seed = Math.round(Math.random() * 10000);
};

Town.prototype.generateRandomSeed = function() {
  this.randomSeed();
  this.generate();
};

module.exports = Town;