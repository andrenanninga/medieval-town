'use strict';

var _       = require('underscore');
var THREE   = require('three');

var objects = require('./objects');

global.THREE = THREE;

require('./plugins/MTLLoader');
require('./plugins/OBJMTLLoader');

var cache = {};
var loader = new THREE.OBJMTLLoader();

exports.load = function() {
  _.each(objects, function(objectName) {
    loader.load(
      'assets/models/' + objectName + '.obj',
      'assets/models/' + objectName + '.mtl',
      function(object) {
        cache[objectName] = object;
      }
    );
  });
};

exports.get = function(objectName) {
  return cache[objectName].clone();
};