'use strict';

var Voxel = function(noiseGen, x, y, z) {
  this.noiseGen = noiseGen;
  this.x = x;
  this.y = y;
  this.z = z;

  this.solid = this.isSolid(x, y, z);
  this.north = this.isSolid(x - 1, y, z);
  this.south = this.isSolid(x + 1, y, z);
  this.west = this.isSolid(x, y, z - 1);
  this.east = this.isSolid(x, y, z + 1);
  this.up = this.isSolid(x, y + 1, z);
  this.down = this.isSolid(x, y - 1, z);
};

Voxel.prototype.isSolid = function(x, y, z) {
  if(x < -2 || x > 2 || y < 0 || y > 3 || z < -2 || z > 2) {
    return false;
  }

  return this.noiseGen.get3DNoise(x, y, z) - y / 4 > 0; 
};

module.exports = Voxel;