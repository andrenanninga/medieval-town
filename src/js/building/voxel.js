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

  this.solid       = this.isSolid(x    , y    , z    );
  
  this.up          = this.isSolid(x    , y + 1, z    );
  this.down        = this.isSolid(x    , y - 1, z    );
  
  this.north       = this.isSolid(x - 1, y    , z    );
  this.northEast   = this.isSolid(x - 1, y    , z + 1);
  this.east        = this.isSolid(x    , y    , z + 1);
  this.southEast   = this.isSolid(x + 1, y    , z + 1);
  this.south       = this.isSolid(x + 1, y    , z    );
  this.southWest   = this.isSolid(x + 1, y    , z - 1);
  this.west        = this.isSolid(x    , y    , z - 1);
  this.northWest   = this.isSolid(x - 1, y    , z - 1);
  
  this.upNorth     = this.isSolid(x - 1, y + 1, z    );
  this.upNorthEast = this.isSolid(x - 1, y + 1, z + 1);
  this.upEast      = this.isSolid(x    , y + 1, z + 1);
  this.upSouthEast = this.isSolid(x + 1, y + 1, z + 1);
  this.upSouth     = this.isSolid(x + 1, y + 1, z    );
  this.upSouthWest = this.isSolid(x + 1, y + 1, z - 1);
  this.upWest      = this.isSolid(x    , y + 1, z - 1);
  this.upNorthWest = this.isSolid(x - 1, y + 1, z - 1);

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