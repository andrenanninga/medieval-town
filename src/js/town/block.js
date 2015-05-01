/* global queue */

'use strict';

var _         = require('underscore');
var THREE     = require('three');
var SAT       = require('sat');
var tinycolor = require('tinycolor2');

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

  this.grid = this.getGrid();
  this.sections = this.getSections(this.grid);

  self._debugGrid(this.grid);
  self._debugBlock();

  this._fillSections(this.sections);

  this.parent.add(this.debug);
  this.parent.add(this.group);
};

Block.prototype.getGrid = function() {
  var grid = [];

  for(var i = 0; i < this.points.length; i++) {
    var start = this.points[i];
    var end = (i < this.points.length - 1) ? this.points[i + 1] : this.points[0];

    start = new THREE.Vector3(start[0], 0, start[1]);
    end = new THREE.Vector3(end[0], 0, end[1]);

    var edgeGrid = this._getGridOnEdge(i, start, end);
    grid.push(edgeGrid);
  }


  grid = _.flatten(grid);
  grid = this._filterGridOutside(grid);
  grid = this._filterGridOverlap(grid);

  return grid;
};

Block.prototype._getGridOnEdge = function(edge, start, end) {
  var grid = [];

  var distance = start.distanceTo(end);
  var normal = end.clone().sub(start).normalize();
  var perpendicular = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  var angle = normal.angleTo(new THREE.Vector3(0, 0, (normal.x < 0) ? 1 : -1));
  var otherAngle = normal.angleTo(new THREE.Vector3(0, 0, (normal.x < 0) ? -1 : 1));

  if(normal.x < 0) {
    otherAngle -= Math.PI;
  }

  var halfSquare = this.squareSize / 2;
  var widthStart = halfSquare;
  var widthEnd = distance - widthStart * 2;
  var depthStart = halfSquare;
  var depthEnd = this.depth * this.squareSize + depthStart;

  var column = 0;

  for(var i = widthStart; i < widthEnd; i += this.squareSize) {
    var row = 0;

    for(var j = depthStart; j < depthEnd; j += this.squareSize) {

      var position = start.clone()
        .add(normal.setLength(i))
        .add(perpendicular.setLength(j + 0.005));

      var square = new SAT.Polygon(new SAT.Vector(0, 0), [
        new SAT.Vector(-halfSquare, -halfSquare),
        new SAT.Vector(+halfSquare, -halfSquare),
        new SAT.Vector(+halfSquare, +halfSquare),
        new SAT.Vector(-halfSquare, +halfSquare)
      ]);

      square.setOffset(new SAT.Vector(position.x, position.z));
      square.rotate(angle);

      square.a = otherAngle;

      square.edge = edge;
      square.row = row;
      square.column = column;

      grid.push(square);

      row += 1;
    }

    column += 1;
  }

  return grid;
},

Block.prototype._filterGridOutside = function(grid) {
  var newGrid = [];
  var response = new SAT.Response();
  var polygon = new SAT.Polygon(
    new SAT.Vector(0, 0), 
    _.map(this.points, function(point) { 
      return new SAT.Vector(point[0], point[1]); 
    })
  );

  for(var i = 0; i < grid.length; i++) {
    var square = grid[i];

    var collided = SAT.testPolygonPolygon(square, polygon, response);

    if(collided && response.aInB) {
      newGrid.push(square);
    }

    response.clear();
  }

  return newGrid;
};

Block.prototype._filterGridOverlap = function(grid) {
  var removals = [];

  for(var i = 0; i < grid.length - 1; i++) {
    for(var j = i + 1; j < grid.length; j++) {
      var square1 = grid[i];
      var square2 = grid[j];

      if(square1.edge === square2.edge) {
        continue;
      }

      if(SAT.testPolygonPolygon(square1, square2)) {
        if(square1.column >= square2.column) {
          removals.push(i);
        }
        else {
          removals.push(j);
        }
      }
    }
  }

  removals = _.uniq(removals);
  var newGrid = _.filter(grid, function(square, i) {
    return !_.contains(removals, i);
  });

  return newGrid;
};

Block.prototype.getSections = function(grid) {
  var filterEdge = function(edge) { 
    return function(square) { return square.edge === edge; }; 
  };
  var filterColumn = function(column) { 
    return function(square) { return square.column === column; }; 
  };

  var sections = [];

  for(var i = 0; i < this.points.length; i++) {
    var squares = _.filter(grid, filterEdge(i));
    var columns = _.chain(squares).pluck('column').uniq().value();
    var lastColumnSize = -1;
    var section = null;

    for(var j = 0; j < columns.length; j++) {
      var column = _.filter(squares, filterColumn(columns[j]));

      if(column.length !== lastColumnSize || section.length >= 7) {
        if(section) {
          sections.push(_.flatten(section));
        }

        section = [];
      }

      section.push(column);
      lastColumnSize = column.length;
    }

    if(section) {
      sections.push(_.flatten(section));
    }
  }

  return sections;
};

Block.prototype._fillSections = function(sections) {
  for(var i = 0; i < sections.length; i++) {
    var func = _.bind(function(section) {
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
    }, this, sections[i]);

    queue.push(func);
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