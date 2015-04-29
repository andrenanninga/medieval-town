'use strict';

var _          = require('underscore');
var THREE      = require('three');
var SAT        = require('sat');
var Chance     = require('chance');
var seedrandom = require('seedrandom');

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
  var t0 = performance.now();

  this.seed = Date.now();
  this.rng = seedrandom(this.seed);
  chance.random = this.rng;

  this.group.remove.apply(this.group, this.group.children);
  this.debug.remove.apply(this.debug, this.debug.children);

  var material = new THREE.MeshNormalMaterial({ wireframe: true });
  var geometry = new THREE.Geometry();
  var points = [];

  var x = chance.integer({ min: 0, max: 30 });
  var z = chance.integer({ min: 0, max: 30 });
  geometry.vertices.push(new THREE.Vector3(x, 0, z));
  points.push(new THREE.Vector3(x, 0, z));

  var x = chance.integer({ min: 0, max: 30 });
  var z = chance.integer({ min: -30, max: 0 });
  geometry.vertices.push(new THREE.Vector3(x, 0, z));
  points.push(new THREE.Vector3(x, 0, z));

  var x = chance.integer({ min: -30, max: 0 });
  var z = chance.integer({ min: -30, max: 0 });
  geometry.vertices.push(new THREE.Vector3(x, 0, z));
  points.push(new THREE.Vector3(x, 0, z));

  var x = chance.integer({ min: -30, max: 0 });
  var z = chance.integer({ min: 0, max: 30 });
  geometry.vertices.push(new THREE.Vector3(x, 0, z));
  points.push(new THREE.Vector3(x, 0, z));

  this.polygon = new SAT.Polygon(new SAT.Vector(0, 0), [
    new SAT.Vector(points[0].x, points[0].z), 
    new SAT.Vector(points[1].x, points[1].z), 
    new SAT.Vector(points[2].x, points[2].z), 
    new SAT.Vector(points[3].x, points[3].z), 
  ]);

  var m;
  m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
  m.position.x = this.polygon.calcPoints[0].x;
  m.position.z = this.polygon.calcPoints[0].y;
  this.group.add(m);
  m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
  m.position.x = this.polygon.calcPoints[1].x;
  m.position.z = this.polygon.calcPoints[1].y;
  this.group.add(m);
  m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
  m.position.x = this.polygon.calcPoints[2].x;
  m.position.z = this.polygon.calcPoints[2].y;
  this.group.add(m);
  m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
  m.position.x = this.polygon.calcPoints[3].x;
  m.position.z = this.polygon.calcPoints[3].y;
  this.group.add(m);

  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.faces.push(new THREE.Face3(0, 2, 3));
  geometry.faces[0].normal.y = -1;
  geometry.faces[1].normal.y = -1;
  this.group.add(new THREE.Mesh(geometry, material));

  this._getGrids(points);

  this.parent.add(this.group);

  var t1 = performance.now();
  console.log('generate() ' + (t1 - t0) + 'ms');
};

Town.prototype.randomSeed = function() {
  this.seed = Math.round(Math.random() * 10000);
};

Town.prototype.generateRandomSeed = function() {
  this.randomSeed();
  this.generate();
};

Town.prototype._getGrids = function(points) {
  var i, j, k, l;
  var material = new THREE.MeshNormalMaterial({ wireframe: true });

  var grids = [];

  for(i = 0; i < 4; i++) {
    var start = points[i];
    var end = (i < points.length -1) ? points[i + 1] : points[0];
    var distance = start.distanceTo(end);

    var normal = end.clone().sub(start).normalize();
    var perp = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    var angle1 = normal.angleTo(new THREE.Vector3(0, 0, 1));
    var angle2 = normal.angleTo(new THREE.Vector3(0, 0, -1));

    var angle = normal.x < 0 ? angle1 : angle2; 
    var squares = [];

    for(j = 1.5; j < distance; j += 3) {
      for(k = 1.5; k < 29; k += 3) {
        var pos = start.clone()
          .add(normal.setLength(j))
          .add(perp.setLength(k + 0.005));

        var square = new SAT.Polygon(new SAT.Vector(0, 0), [
          new SAT.Vector(-1.49, -1.49),
          new SAT.Vector(+1.49, -1.49),
          new SAT.Vector(+1.49, +1.49),
          new SAT.Vector(-1.49, +1.49),
        ]);

        square.depth = k;

        square.setOffset(new SAT.Vector(pos.x, pos.z));
        square.rotate(angle);

        squares.push(square);
      }
    }

    var response = new SAT.Response();
    squares = _.filter(squares, function(square) {
      response.clear();
      var collided = SAT.testPolygonPolygon(square, this.polygon, response);
      return collided && response.aInB;
    }, this);

    grids.push(squares);
  }

  console.log(grids);

  grids = _.flatten(grids);
  console.log(grids.length);
  var deletes = [];

  for(i = 0; i < grids.length - 1; i++) {
    for(j = i + 1; j < grids.length; j++) {
      var square1 = grids[i];
      var square2 = grids[j];

      if(SAT.testPolygonPolygon(square1, square2)) {
        if(square1.depth >= square2.depth) {
          deletes.push(i);
        }
        else {
          deletes.push(j);
        }
      }
    }
  }

  deletes = _.uniq(deletes);
  console.log(deletes, grids.length);

  for(j = 0; j < grids.length; j++) {
    if(_.contains(deletes, j)) {
      continue;
    }

    var square = grids[j];

    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[0].x, 0, square.calcPoints[0].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[1].x, 0, square.calcPoints[1].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[2].x, 0, square.calcPoints[2].y));
    geometry.vertices.push(new THREE.Vector3(square.calcPoints[3].x, 0, square.calcPoints[3].y));

    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));

    geometry.faces[0].normal = new THREE.Vector3(0, 1, 0);
    geometry.faces[1].normal = new THREE.Vector3(0, 1, 0);

    var m = new THREE.Mesh(geometry, material);
    this.group.add(m);
  }

};

module.exports = Town;