'use strict';

var _                = require('underscore');
var THREE            = require('three');
var FastSimplexNoise = require('fast-simplex-noise');
var models           = require('../models');
var Voxel            = require('./voxel');

var X = 3;
var Y = 2.5;
var Z = 3;

var Building = function(parent, x, y) {
  this.amplitude = 1;
  this.frequency = 0.14;
  this.octaves = 16;
  this.persistence = 0.5;

  this.group = new THREE.Group();
  this.group.position.x = x;
  this.group.position.z = y;

  parent.add(this.group);
};

Building.prototype.generate = function() {
  this.noiseGen = new FastSimplexNoise({ 
    frequency: this.frequency, 
    octaves: this.octaves
  });

  this.group.remove.apply(this.group, this.group.children);

  for(var x = -3; x <= 3; x++) {
    for(var y = 0; y <= 3; y++) {
      for(var z = -3; z <= 3; z++) {
        var voxel = new Voxel(this.noiseGen, x, y, z);

        // this._debugBox(voxel);
        this._setFloor(voxel);
        this._setRoof(voxel);
        this._setWalls(voxel);
        this._setPillars(voxel);
      }
    }
  }
};


Building.prototype._setFloor = function(voxel) {
  if(voxel.solid) {
    var floor = models.get('Plate_Wood_01');
    floor.position.set(voxel.x * X, voxel.y * Y - 1.25, voxel.z * Z);
    this.group.add(floor);
  }
};

Building.prototype._setRoof = function(voxel) {
  var roof;
  var position = new THREE.Vector3(voxel.x * X, voxel.y * Y, voxel.z * Z);
  var rotation = new THREE.Euler(0, 0, 0, 'XYZ');

  if(voxel.solid && !voxel.up) {
    if(!voxel.north && !voxel.east && !voxel.south && !voxel.west) {
      if(voxel.y > 1) {
        roof = models.get('Roof_Point_Green_01');
        position.y += 1.2;
      }
      else {
        roof = models.get('Plate_Road_01');
        position.y += 1.2;
      }
    }
    else if(!voxel.south) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
    }
    else if(!voxel.north) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI;
    }
    else {
      roof = models.get('Roof_Flat_Green_01');
      position.y += 1.2;
    }

    if(roof) {
      roof.position.set(position.x, position.y, position.z);
      roof.rotation.set(rotation.x, rotation.y, rotation.z, rotation.order);
      this.group.add(roof);
    }
  }
};

Building.prototype._setWalls = function(voxel) {
  if(!voxel.solid) { return; }  
  
  var sides = [
    [voxel.north, -1, 0],
    [voxel.south, 1, 0],
    [voxel.west, 0, -1], 
    [voxel.east, 0, 1]
  ];

  for(var i = 0; i < sides.length; i++) {
    var side = sides[i];

    if(!side[0]) {
      var wall = models.get('Wood_Wall_01');

      wall.position.x = voxel.x * X + 1.25 * side[1];
      wall.position.y = voxel.y * Y - 0.95;
      wall.position.z = voxel.z * Z + 1.25 * side[2];
      wall.rotation.y = side[2] * Math.PI / 2;

      this.group.add(wall);
    }
  }
};

Building.prototype._setPillars = function(voxel) {
  if(voxel.solid) { return; }

  var up = _.chain(5)
    .times(_.identity)
    .map(function(i) { 
      return voxel.isSolid(voxel.x, voxel.y + i, voxel.z);
    })
    .some()
    .value();

  if(up) {
    var pillar;
    var pillars = {
      northWest: { place: true, x: -1.2, z: -1.2 },
      northEast: { place: true, x: -1.2, z: 1.2 },
      southWest: { place: true, x: 1.2, z: -1.2 },
      southEast: { place: true, x: 1.2, z: 1.2 }
    };

    if(voxel.north && voxel.west) {
      pillars.northWest.place = false;
    }
    if(voxel.north && voxel.east) {
      pillars.northEast.place = false;
    }
    if(voxel.south && voxel.west) {
      pillars.southWest.place = false;
    }
    if(voxel.south && voxel.east) {
      pillars.southEast.place = false;
    }

    _.each(pillars, function(value) {
      if(!value.place) { 
        return;
      }

      pillar = models.get('Wood_Pole_01');
      pillar.position.x = voxel.x * X + value.x;
      pillar.position.y = voxel.y * Y - 1.25;
      pillar.position.z = voxel.z * Z + value.z;
      this.group.add(pillar);
    }, this);
  }
};

Building.prototype._debugBox = function(voxel) {
  if(!voxel.solid) { return; }  

  var material = new THREE.MeshNormalMaterial({ wireframe: true });
  var geometry = new THREE.BoxGeometry(X, Y, Z);
  var mesh = new THREE.Mesh(geometry, material);

  mesh.position.x = voxel.x * X;
  mesh.position.y = voxel.y * Y;
  mesh.position.z = voxel.z * Z;

  this.group.add(mesh);
};

module.exports = Building;
