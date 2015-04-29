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

  this.seed = 10;
  this.rng = seedrandom(this.seed);
  chance.random = this.rng;

  this.group.remove.apply(this.group, this.group.children);
  this.debug.remove.apply(this.debug, this.debug.children);

  var material = new THREE.MeshNormalMaterial({ wireframe: true });
  var geometry = new THREE.Geometry();
  var points = [];

  for(var i = 0; i < 3; i++) {
    var x = chance.integer({ min: -30, max: 30 });
    var z = chance.integer({ min: -30, max: 30 });
    geometry.vertices.push(new THREE.Vector3(x, 0, z));
    points.push(new THREE.Vector3(x, 0, z));
  }

  this.polygon = new SAT.Polygon(new SAT.Vector(0, 0), [
    new SAT.Vector(points[0].x, points[0].z), 
    new SAT.Vector(points[1].x, points[1].z), 
    new SAT.Vector(points[2].x, points[2].z), 
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

  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.faces[0].normal.y = -1;
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
  var material = new THREE.MeshNormalMaterial({ wireframe: true });

  for(var i = 0; i < 1; i++) {
    var start = points[i];
    console.log(start);
    var end = (i < points.length -1) ? points[i + 1] : points[0];
    var distance = start.distanceTo(end);

    var normal = end.clone().sub(start).normalize();
    var perp = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

    var squares = [];
    var mesh;

    for(var j = 1.5; j < distance; j += 3) {
      for(var k = 1.5; k < 9; k += 3) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.001, 3), material);

        var pos = start.clone()
          .add(normal.setLength(j))
          .add(perp.setLength(k));

        var angle = normal.angleTo(new THREE.Vector3(-1, 0, 0));

        var square = new SAT.Polygon(new SAT.Vector(pos.x, pos.z), [
          new SAT.Vector(pos.x - 1.5, pos.z - 1.5),
          new SAT.Vector(pos.x + 1.5, pos.z - 1.5),
          new SAT.Vector(pos.x + 1.5, pos.z + 1.5),
          new SAT.Vector(pos.x - 1.5, pos.z + 1.5),
        ]);

        // square.translate(-pos.x, -pos.z);
        // square.rotate(angle);
        // square.translate(pos.x, pos.z);

        squares.push(square);


        mesh.position.x = pos.x;
        mesh.position.z = pos.z;
        mesh.rotation.y = -angle;
        this.group.add(mesh);
        // break;
      }
      // break;
    }

    var response = new SAT.Response();
    for(var j = 0; j < squares.length; j++) {
      var square = squares[j];
      var collided = SAT.testPolygonPolygon(square, this.polygon, response);

      if(!response.bInA) {
        console.log(square);
      }
      else {
        var m;
        m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
        m.position.x = square.calcPoints[0].x;
        m.position.z = square.calcPoints[0].y;
        this.group.add(m);
        m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
        m.position.x = square.calcPoints[1].x;
        m.position.z = square.calcPoints[1].y;
        this.group.add(m);
        m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
        m.position.x = square.calcPoints[2].x;
        m.position.z = square.calcPoints[2].y;
        this.group.add(m);
        m = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
        m.position.x = square.calcPoints[3].x;
        m.position.z = square.calcPoints[3].y;
        this.group.add(m);
      }


      response.clear();
    }
  }
};

module.exports = Town;