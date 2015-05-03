'use strict';

var _         = require('underscore');
var THREE     = require('three');
var NProgress = require('nprogress');

var objects   = require('./objects');

global.THREE = THREE;

require('./plugins/MTLLoader');
require('./plugins/OBJMTLLoader');

var cache = {};
var loader = new THREE.OBJMTLLoader();
global.cache = cache;
global._ = _;

exports.load = function(cb) {
  NProgress.start();
  NProgress.configure({ trickle: false });

  _.each(objects, function(objectName, i) {
    loader.load(
      'assets/models/' + objectName + '.obj',
      'assets/models/' + objectName + '.mtl',
      function(object) {
        cache[objectName] = object;

        NProgress.set(_.values(cache).length / objects.length);

        if(_.values(cache).length === objects.length) {
          NProgress.done(); 
          cb();
        }
      }
    );
  });
};

exports.get = function(objectName) {
  return cache[objectName].clone();
};

exports.toJSON = function(objectName) {
  return cache(objectName).toJSON();
};

exports.cache = cache;