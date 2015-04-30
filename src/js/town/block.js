'use strict';

var _         = require('underscore');
var async     = require('async');
var THREE     = require('three');
var SAT       = require('sat');
var tinycolor = require('tinycolor2');

var BlockWorker = require('./blockWorker');

var Building  = require('../building/building');

var index = 0;

var Block = function(parent, points) {
  this.parent = parent;
  this.points = points;
  this.index = index++;

  this.squareSize = 3;
  this.depth = 3;

  this.group = new THREE.Group();
  this.debug = new THREE.Group();
};

Block.prototype.generate = function() {
  console.time('block.generate.' + this.index);
  var self = this;

  async.waterfall([
    function(cb) {
      BlockWorker.getGrid(self.points, cb);
    },
    function(grid, cb) {
      self._debugGrid(grid);
      self._debugBlock();

      BlockWorker.getSections(self.points, grid, cb);
    },
    function(sections) {
      self._fillSections(sections);
      console.timeEnd('block.generate.' + self.index);
    }
  ]);

  this.parent.add(this.debug);
  this.parent.add(this.group);
};

Block.prototype._fillSections = function(sections) {
  for(var i = 0; i < sections.length; i++) {
    var section = sections[i];

    var pos = section[0].offset;
    var columns = _.chain(section).pluck('column').uniq().value().length;
    var rows = _.chain(section).pluck('row').uniq().value().length;
    var height = 2 + Math.round(Math.random() * 2);

    var building = new Building(this.group, pos.x, pos.y, rows, height, columns);
    building.solidChance = 0.8;
    building.heightDampener = 0.1;
    building.generate();
    building.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), section[0].a);
    building.mesh.position.y += 1.25;
  }
};

Block.prototype._debugBlock = function() {
  var i;
  var geometry = new THREE.Geometry();
  var material = new THREE.MeshBasicMaterial({ color: tinycolor.random().toHexString(), wireframe: true });
  var mesh = new THREE.Mesh(geometry, material);

  for(i = 0; i < this.points.length; i++) {
    geometry.vertices.push(new THREE.Vector3(this.points[i][0], 0, this.points[i][1]));
  }

  for(i = 0; i < this.points.length - 2; i++) {
    var face = new THREE.Face3(0, i + 1, i + 2);
    face.normal.y = -1;
    geometry.faces.push(face);
  }

  this.debug.add(mesh);
};

Block.prototype._debugGrid = function(grid) {
  var material = new THREE.MeshNormalMaterial({ wireframe: true });

  for(var j = 0; j < grid.length; j++) {
    var square = grid[j];

    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[0].x, 0, square.calcPoints[0].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[1].x, 0, square.calcPoints[1].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[2].x, 0, square.calcPoints[2].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[3].x, 0, square.calcPoints[3].y));

    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));

    geometry.faces[0].normal = new THREE.Vector3(0, 1, 0);
    geometry.faces[1].normal = new THREE.Vector3(0, 1, 0);

    var mesh = new THREE.Mesh(geometry, material);
    this.debug.add(mesh);
  }
};

module.exports = Block;