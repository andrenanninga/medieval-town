'use strict';

var _                = require('underscore');
var THREE            = require('three');
var FastSimplexNoise = require('fast-simplex-noise');
var tinycolor        = require('tinycolor2');
var Chance           = require('chance');
var seedrandom       = require('seedrandom');
var models           = require('../models');
var Voxel            = require('./voxel');

var X = 3;
var Y = 2.5;
var Z = 3;

var chance = new Chance();

var colors = {
  'Wood': ['#4C3A1E', '#403019', '#332714', '#514534', '#46342D', '#2E302A'],
  'Green_Roof': ['#B7CE82', '#D9C37E', '#759B8A', '#A78765', '#CE6A58'],
  'Dark_Stone': ['#767D85', '#6A6B5F', '#838577', '#686157', '#62554D', '#626A5B']
};

var index = 0;

var Building = function(parent, x, y, width, height, depth) {
  this.parent = parent;
  this.index = index++;

  this.amplitude = 1;
  this.frequency = 0.08;
  this.octaves = 16;
  this.persistence = 0.5;

  this.solidChance = 0.65;
  this.roofPointChance = 0.6;
  this.wallWindowChance = 0.3;
  this.wallDoorChance = 0.1;
  this.bannerChance = 0.1;
  this.shieldChance = 0.1;
  this.fenceChance = 0.4;

  this.heightDampener = 0.125;

  this.seed = 0;
  this.randomSeed();

  this.showDebug = false;

  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.depth = depth;

  this.group = new THREE.Group();
  this.debug = new THREE.Group();
};

Building.prototype.isSolid = function(x, y, z) {
  if(x < 0 || x >= this.width || z < 0 || z >= this.depth || y < 0 || y >= this.height) {
    return false;
  }

  var n = (this.noiseGen.get3DNoise(x, y, z) + 1) / 2;
  n = n - y * this.heightDampener;
  n = Math.max(n, 0);

  var solid = n > (1 - this.solidChance);

  return solid; 
};

Building.prototype.isBorder = function(x, y, z) {
  if(x === 0 || x === this.width || z === 0 || z === this.depth || y === 0 || y === this.height) {
    return true;
  }

  return false;
};

Building.prototype.isOutside = function(x, y, z) {
  if(x < 0 || x >= this.width || z < 0 || z >= this.depth || y < 0 || y >= this.height) {
    return true;
  }

  return false;
};

Building.prototype.generate = function() {
  console.time('building.generate.' + this.index);
  var self = this;

  this.rng = seedrandom(this.seed);
  chance.random = this.rng;

  this.noiseGen = new FastSimplexNoise({ 
    frequency: this.frequency, 
    octaves: this.octaves,
    amplitude: this.amplitude,
    persistence: this.persistence,
    random: this.rng
  });

  this.group.remove.apply(this.group, this.group.children);
  this.debug.remove.apply(this.debug, this.debug.children);

  this.colors = _.chain(colors)
    .mapObject(function(colors) { return chance.pick(colors); })
    .mapObject(function(color) {
      var rgb = tinycolor(color).toRgb();
      
      rgb.r /= 255;
      rgb.g /= 255;
      rgb.b /= 255;
      rgb.hex = color;

      return rgb;
    })
    .value();

  var hasFence = this.rng() < this.fenceChance;

  for(var x = 0; x < this.width; x++) {
    for(var y = 0; y < this.height; y++) {
      for(var z = 0; z < this.depth; z++) {
        var voxel = new Voxel(this, x, y, z);

        if(this.showDebug) {
          this._debugBox(voxel);
        }

        this._setFloor(voxel);
        this._setRoof(voxel);
        this._setWalls(voxel);
        this._setPillars(voxel);

        if(hasFence) {
          this._setFence(voxel);
        }
      }
    }
  }

  var geometry = new THREE.Geometry();
  var materials = {};

  this.group.updateMatrixWorld();

  this.group.traverse(function(object) {
    if(object.type === 'Mesh') {
      object.position.setFromMatrixPosition(object.matrixWorld);
      object.rotation.setFromRotationMatrix(object.matrixWorld);
      object.updateMatrix();

      var index = _.chain(materials).keys().indexOf(object.material.name).value();

      if(index === -1) {
        var material = object.material.clone();

        var color = self.colors[object.material.name];
        if(color) {
          material.color.r = color.r;
          material.color.g = color.g;
          material.color.b = color.b;
        }

        materials[object.material.name] = material;
        index = _.keys(materials).length - 1;
      }

      geometry.merge(object.geometry, object.matrix, index);
    }
  });

  if(this.mesh) {
    this.parent.remove(this.mesh);
  }

  var material = new THREE.MeshFaceMaterial(_.values(materials));
  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.add(this.debug);
  this.mesh.position.x = this.x;
  this.mesh.position.z = this.y;

  this.parent.add(this.mesh);
  
  console.timeEnd('building.generate.' + this.index);
};

Building.prototype.randomSeed = function() {
  this.seed = Math.round(Math.random() * 10000);
};

Building.prototype.generateRandomSeed = function() {
  this.randomSeed();
  this.generate();
};

Building.prototype._setFloor = function(voxel) {
  var floor;

  if(voxel.y === 0 && !voxel.solid) {
    // floor = models.get('Plate_Road_01');
    // floor.position.set(voxel.x * X, voxel.y * Y - 1.25, voxel.z * Z);
    // this.group.add(floor);
  }
  else if(voxel.solid) {
    floor = models.get('Plate_Wood_01');
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
      if(this.rng() < this.roofPointChance) {
        roof = models.get('Roof_Point_Green_01');
        position.y += 1.2;
      }
      else {
        roof = models.get('Roof_Straight_Green_01');
        position.y += 1.2;
        rotation.y = (this.rng() > 0.5) ? Math.PI / 2 : 0;
      }
    }
    else if(!voxel.south && !voxel.north && (voxel.east || voxel.west)) {
      roof = models.get('Roof_Straight_Green_01');
      position.y += 1.25;
      rotation.y = Math.PI / 2;
    }
    else if(!voxel.west && !voxel.east && (voxel.north || voxel.south)) {
      roof = models.get('Roof_Straight_Green_01');
      position.y += 1.25;
    }
    else if(!voxel.south && this.depth > this.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
    }
    else if(!voxel.north && this.depth > this.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI;
    }
    else if(!voxel.east && this.depth <= this.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI + Math.PI / 2;
    }
    else if(!voxel.west && this.depth <= this.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI / 2;
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
  
  var type;
  var wall;
  var sides = [
    [voxel.north, -1, 0, Math.PI],
    [voxel.south, 1, 0, 0],
    [voxel.west, 0, -1, Math.PI / 2], 
    [voxel.east, 0, 1, Math.PI / -2]
  ];

  for(var i = 0; i < sides.length; i++) {
    var side = sides[i];

    if(!side[0]) {
      if(voxel.y === 0 && this.rng() < this.wallDoorChance) {
        wall = models.get('Wood_Door_Round_01');
      }
      else if(this.rng() < this.wallWindowChance) {
        wall = models.get('Wood_Window_Round_01');
      }
      else {

        type = chance.pick([
          'Wood_Wall_01', 
          'Wood_Wall_Double_Cross_01', 
          'Wood_Wall_Cross_01'
        ]);
        wall = models.get(type);

        if(type === 'Wood_Wall_01' && this.rng() < this.bannerChance) {
          var banner = models.get('Banner_Short_01');

          banner.rotation.y = Math.PI / 2;
          banner.position.x = 0.2;
          banner.position.y = 0.1;

          wall.add(banner);
        }
        else if(type === 'Wood_Wall_01' && this.rng() < this.shieldChance) {
          var shield = models.get('Shield_Green_01');

          shield.rotation.y = 0; 
          shield.position.x = 0.2;
          shield.position.y = 0.8;

          wall.add(shield);
        }
      }

      wall.position.x = voxel.x * X + 1.25 * side[1];
      wall.position.y = voxel.y * Y - 0.95;
      wall.position.z = voxel.z * Z + 1.25 * side[2];
      wall.rotation.y = side[3];

      this.group.add(wall);
    }
  }
};

Building.prototype._setPillars = function(voxel) {
  if(voxel.solid) { return; }

  if(voxel.ceiling) {
    var pillar; 
    var pillars = {
      northWest: { place: true, x: -1.2, z: -1.2, rot: 0 },
      northEast: { place: true, x: -1.2, z: 1.2, rot: Math.PI / 2 },
      southWest: { place: true, x: 1.2, z: -1.2, rot: Math.PI / -2 },
      southEast: { place: true, x: 1.2, z: 1.2, rot: Math.PI }
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
      pillar.rotation.y = value.rot;
      this.group.add(pillar);
    }, this);
  }
};

Building.prototype._setFence = function(voxel) {
  var material, geometry, mesh;

  if(voxel.y === 0 && voxel.border && !voxel.solid && !voxel.ceiling) {
    var fence;
    var sides = [
      [voxel.north, -1, 0, 0],
      [voxel.south, 1, 0, Math.PI],
      [voxel.west, 0, -1, Math.PI / -2], 
      [voxel.east, 0, 1, Math.PI / 2]
    ];

    for(var i = 0; i < sides.length; i++) {
      var side = sides[i];

      if(voxel.isOutside(voxel.x + side[1], voxel.y, voxel.z + side[2]) && !side[0]) {
        fence = models.get('Grey_Short_Wall_01');

        fence.position.x = voxel.x * X + 1.25 * side[1];
        fence.position.y = voxel.y * Y - 1.25;
        fence.position.z = voxel.z * Z + 1.25 * side[2];
        fence.rotation.y = side[3];

        this.group.add(fence);
      }
    }
  }
};

Building.prototype._debugBox = function(voxel) {
  var material, geometry, mesh;

  if(voxel.solid) {   
    material = new THREE.MeshNormalMaterial({ wireframe: true });
    geometry = new THREE.BoxGeometry(X, Y, Z);
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'debug';

    mesh.position.x = voxel.x * X;
    mesh.position.y = voxel.y * Y;
    mesh.position.z = voxel.z * Z;

    this.debug.add(mesh);
  }
  else if(voxel.y === 0) {
    material = new THREE.MeshNormalMaterial({ wireframe: true });
    geometry = new THREE.BoxGeometry(X, 0.0001, Z);
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'debug';

    mesh.position.x = voxel.x * X;
    mesh.position.y = voxel.y * Y - Y / 2;
    mesh.position.z = voxel.z * Z;

    this.debug.add(mesh);
  }
};

module.exports = Building;
