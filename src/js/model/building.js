'use strict';

var _ = require('underscore');
var models = require('../models');
var FastSimplexNoise = require('fast-simplex-noise');

var Building = function() {};

Building.X = 3;
Building.Y = 2.5;
Building.Z = 3;

Building.defaults = {
  width: 4,
  height: 3,
  depth: 4,

  amplitude: 1,
  frequency: 0.08,
  octaves: 16,
  persistence: 0.5,

  heightDampener: 0.1,

  solidChance: 0.65,
  roofPointChance: 0.6,
  wallWindowChance: 0.3,
  wallDoorChance: 0.1,
  bannerChance: 0.1,
  shieldChance: 0.1,
  fenceChance: 0.4,

  seed: 0,

  debug: false
};

Building.colors = {
  'Debug': [0xFF1493],
  'Black': [0x000000],
  'White': [0xffffff],
  'Wood': [0x4C3A1E, 0x403019, 0x332714, 0x514534, 0x46342D, 0x2E302A],
  'Green_Roof': [0xB7CE82, 0xD9C37E, 0x759B8A, 0xA78765, 0xCE6A58],
  'Red_Cotton': [0x683131],
  'Red_Roof': [0x7E3C3C],
  'Dark_Stone': [0x767D85, 0x6A6B5F, 0x838577, 0x686157, 0x62554D, 0x626A5B],
};

Building.prototype.generate = function(options, callback) {
	options = _.extend({}, Building.defaults, options);
	callback = callback || _.noop;

  this.options = options;
  this.group = new THREE.Group();

  this.rng = Math.random;
  this.noiseGen = new FastSimplexNoise({ 
    frequency: this.options.frequency, 
    octaves: this.options.octaves,
    amplitude: this.options.amplitude,
    persistence: this.options.persistence,
    random: this.rng
  });

  var hasFence = this.rng() < this.options.fenceChance;

  for(var x = 0; x < this.options.width; x++) {
    for(var y = 0; y < this.options.height; y++) {
      for(var z = 0; z < this.options.depth; z++) {

        var voxel = this._getVoxel(x, y, z);

        if(this.options.debug) {
          this._debugBox(voxel);
        }
        else {
          this._setFloor(voxel);
          this._setWalls(voxel);
          this._setRoof(voxel);
          this._setPillars(voxel);

          if(hasFence) {
            this._setFence(voxel);
          }
        }
      }
    }
  }

  var colors = this._getColors();
  var mesh = this._merge(colors);

  callback(null, mesh);
};

Building.prototype._setFloor = function(voxel) {
  var floor;

  if(voxel.solid) {
    floor = models.get('Plate_Wood_01');
    floor.position.set(voxel.x * Building.X, voxel.y * Building.Y - 1.25, voxel.z * Building.Z);
    this.group.add(floor);
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

  var types = [
    'Wood_Wall_01', 
    'Wood_Wall_Double_Cross_01', 
    'Wood_Wall_Cross_01'
  ];

  for(var i = 0; i < sides.length; i++) {
    var side = sides[i];

    if(!side[0]) {
      if(voxel.y === 0 && this.rng() < this.options.wallDoorChance) {
        wall = models.get('Wood_Door_Round_01');
      }
      else if(this.rng() < this.options.wallWindowChance) {
        wall = models.get('Wood_Window_Round_01');
      }
      else {

        type = types[Math.floor(this.rng() * types.length)];

        wall = models.get(type);

        if(type === 'Wood_Wall_01' && this.rng() < this.options.bannerChance) {
          var banner = models.get('Banner_Short_01');

          banner.rotation.y = Math.PI / 2;
          banner.position.x = 0.2;
          banner.position.y = 0.1;

          wall.add(banner);
        }
        else if(type === 'Wood_Wall_01' && this.rng() < this.options.shieldChance) {
          var shield = models.get('Shield_Green_01');

          shield.rotation.y = 0; 
          shield.position.x = 0.2;
          shield.position.y = 0.8;

          wall.add(shield);
        }
      }

      wall.position.x = voxel.x * Building.X + 1.25 * side[1];
      wall.position.y = voxel.y * Building.Y - 0.95;
      wall.position.z = voxel.z * Building.Z + 1.25 * side[2];
      wall.rotation.y = side[3];

      this.group.add(wall);
    }
  }
};

Building.prototype._setRoof = function(voxel) {
  var roof;
  var position = new THREE.Vector3(voxel.x * Building.X, voxel.y * Building.Y, voxel.z * Building.Z);
  var rotation = new THREE.Euler(0, 0, 0, 'XYZ');

  if(voxel.solid && !voxel.up) {
    if(!voxel.north && !voxel.east && !voxel.south && !voxel.west) {
      if(this.rng() < this.options.roofPointChance) {
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
    else if(!voxel.south && this.options.depth > this.options.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
    }
    else if(!voxel.north && this.options.depth > this.options.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI;
    }
    else if(!voxel.east && this.options.depth <= this.options.width) {
      roof = models.get('Roof_Slant_Green_01');
      position.y += 1.2;
      rotation.y = Math.PI + Math.PI / 2;
    }
    else if(!voxel.west && this.options.depth <= this.options.width) {
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
      pillar.position.x = voxel.x * Building.X + value.x;
      pillar.position.y = voxel.y * Building.Y - 1.25;
      pillar.position.z = voxel.z * Building.Z + value.z;
      pillar.rotation.y = value.rot;
      this.group.add(pillar);
    }, this);
  }
};

Building.prototype._setFence = function(voxel) {
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

      if(this._isOutside(voxel.x + side[1], voxel.y, voxel.z + side[2]) && !side[0]) {
        fence = models.get('Grey_Short_Wall_01');

        fence.position.x = voxel.x * Building.X + 1.25 * side[1];
        fence.position.y = voxel.y * Building.Y - 1.25;
        fence.position.z = voxel.z * Building.Z + 1.25 * side[2];
        fence.rotation.y = side[3];

        this.group.add(fence);
      }
    }
  }
};

Building.prototype._merge = function(colors) {
  var geometry = new THREE.Geometry();

  this.group.position.x = -this.options.width * Building.X / 2 + Building.X / 2;
  this.group.position.y = Building.Y / 2;
  this.group.position.z = -this.options.depth * Building.Z / 2 + Building.Z / 2;

  this.group.updateMatrixWorld();

  this.group.traverse(function(object) {
    if(object.type === 'Mesh') {
      object.position.setFromMatrixPosition(object.matrixWorld);
      object.rotation.setFromRotationMatrix(object.matrixWorld);
      object.updateMatrix();

      var color = colors[object.material.name];

      for(var i = 0; i < object.geometry.faces.length; i++) {
        var face = object.geometry.faces[i];
        face.color = new THREE.Color(color);
      }

      geometry.merge(object.geometry, object.matrix);
    }
  });

  var material = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors });
  var mesh = new THREE.Mesh(geometry, material);

  return mesh;
};

Building.prototype._getColors = function() {
  return _.mapObject(Building.colors, function(colors) {
    return colors[Math.floor(this.rng() * colors.length)];
  }, this);
};

Building.prototype._debugBox = function(voxel) {
  var material, geometry, mesh;

  if(voxel.solid) {   
    material = new THREE.MeshBasicMaterial({ color: 0xFF1493, name: 'Debug' });
    geometry = new THREE.BoxGeometry(Building.X, Building.Y, Building.Z);
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'debug';

    mesh.position.x = voxel.x * Building.X;
    mesh.position.y = voxel.y * Building.Y;
    mesh.position.z = voxel.z * Building.Z;

    this.group.add(mesh);
  }
  else if(voxel.y === 0) {
    material = new THREE.MeshBasicMaterial({ color: 0xFF1493, name: 'Debug' });
    geometry = new THREE.BoxGeometry(Building.X, 0.0001, Building.Z);
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'debug';

    mesh.position.x = voxel.x * Building.X;
    mesh.position.y = voxel.y * Building.Y - Building.Y / 2;
    mesh.position.z = voxel.z * Building.Z;

    this.group.add(mesh);
  }
};

Building.prototype._getVoxel = function(x, y, z) {
  var self = this;
  var voxel = {};

  voxel.x = x;
  voxel.y = y;
  voxel.z = z;

  voxel.solid       = this._isSolid(x    , y    , z    );
  
  voxel.up          = this._isSolid(x    , y + 1, z    );
  voxel.down        = this._isSolid(x    , y - 1, z    );
  
  voxel.north       = this._isSolid(x - 1, y    , z    );
  voxel.northEast   = this._isSolid(x - 1, y    , z + 1);
  voxel.east        = this._isSolid(x    , y    , z + 1);
  voxel.southEast   = this._isSolid(x + 1, y    , z + 1);
  voxel.south       = this._isSolid(x + 1, y    , z    );
  voxel.southWest   = this._isSolid(x + 1, y    , z - 1);
  voxel.west        = this._isSolid(x    , y    , z - 1);
  voxel.northWest   = this._isSolid(x - 1, y    , z - 1);
  
  voxel.upNorth     = this._isSolid(x - 1, y + 1, z    );
  voxel.upNorthEast = this._isSolid(x - 1, y + 1, z + 1);
  voxel.upEast      = this._isSolid(x    , y + 1, z + 1);
  voxel.upSouthEast = this._isSolid(x + 1, y + 1, z + 1);
  voxel.upSouth     = this._isSolid(x + 1, y + 1, z    );
  voxel.upSouthWest = this._isSolid(x + 1, y + 1, z - 1);
  voxel.upWest      = this._isSolid(x    , y + 1, z - 1);
  voxel.upNorthWest = this._isSolid(x - 1, y + 1, z - 1);

  voxel.border = this._isBorder(x, y, z);
  voxel.outside = this._isOutside(x, y, z);

  voxel.ceiling = _.chain(25).times(_.identity)
    .map(function(i) { return self._isSolid(x, y + i, z); })
    .some().value();

  voxel.floor = _.chain(25).times(_.identity)
    .map(function(i) { return self._isSolid(x, y - i, z); })
    .some().value();

  return voxel;
};

Building.prototype._isSolid = function(x, y, z) {
  if(x < 0 || x >= this.options.width || 
     z < 0 || z >= this.options.depth || 
     y < 0 || y >= this.options.height) {
    return false;
  }

  var n = (this.noiseGen.get3DNoise(x, y, z) + 1) / 2;
  n = n - y * this.options.heightDampener;
  n = Math.max(n, 0);

  var solid = n > (1 - this.options.solidChance);

  return solid; 
};

Building.prototype._isBorder = function(x, y, z) {
  if(x === 0 || x === this.options.width || 
     z === 0 || z === this.options.depth || 
     y === 0 || y === this.options.height) {
    return true;
  }

  return false;
};

Building.prototype._isOutside = function(x, y, z) {
  if(x < 0 || x >= this.options.width || 
     z < 0 || z >= this.options.depth || 
     y < 0 || y >= this.options.height) {
    return true;
  }

  return false;
},

module.exports = Building;