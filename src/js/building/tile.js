'use strict';

var THREE = require('three');

var Tile = function(parent, x, y) {
  this.width = 3;
  this.height = 3;

  this.group = new THREE.Group();
  this.group.position.x = x * this.width;
  this.group.position.z = y * this.height;

  var planeMaterial = new THREE.MeshNormalMaterial({ wireframe: true });
  var planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;

  this.group.add(plane);

  this._debugAnchor(0, 0);   // center

  this._debugAnchor(1, 1);   // south west
  this._debugAnchor(1, -1);  // south east
  this._debugAnchor(-1, 1);  // north west
  this._debugAnchor(-1, -1); // north east

  this._debugAnchor(1, 0);   // south
  this._debugAnchor(-1, 0);  // north
  this._debugAnchor(0, 1);   // west
  this._debugAnchor(0, -1);  // east

  parent.add(this.group);
};

Tile.prototype._debugAnchor = function(x, y) {
  var material = new THREE.MeshNormalMaterial({ wireframe: true });
  var geometry = new THREE.SphereGeometry(0.1, 8, 8);
  var mesh = new THREE.Mesh(geometry, material);

  mesh.position.x = x * this.width / 2;
  mesh.position.z = y * this.height / 2;

  this.group.add(mesh);
};

module.exports = Tile;

