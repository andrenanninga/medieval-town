'use strict';

var _ = require('underscore');

var Voxel = function(parent, x, y, z) {
  var self = this;

  this.isSolid = _.bind(parent.isSolid, parent);
  this.isBorder = _.bind(parent.isBorder, parent);
  this.isOutside = _.bind(parent.isOutside, parent);
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

  this.border = this.isBorder(x, y, z);
  this.outside = this.isOutside(x, y, z);

  this.ceiling = _.chain(25).times(_.identity)
    .map(function(i) { return self.isSolid(self.x, self.y + i, self.z); })
    .some().value();

  this.floor = _.chain(25).times(_.identity)
    .map(function(i) { return self.isSolid(self.x, self.y - i, self.z); })
    .some().value();
};

module.exports = Voxel;