'use strict';

var _         = require('underscore');
var THREE     = require('three');
var Stats     = require('stats.js');
var Dat       = require('dat-gui');
var models    = require('../models');
var queue     = require('../util/queue');

global.THREE = THREE;

var Building  = require('../generators/building');
var Block     = require('../generators/block');

global.Block = Block;
global.Building = Building;

require('../plugins/MTLLoader');
require('../plugins/OBJMTLLoader');
require('../plugins/OrbitControls');


var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xf0f0f0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.x = 25;
camera.position.y = 25;
camera.position.z = 25;

var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

var light = new THREE.AmbientLight(0x222222);
scene.add( light );

var light = new THREE.PointLight( 0xffffff, 0.8, 1000 );
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

var axis = new THREE.AxisHelper(15);
scene.add(axis);

var buildingGroup = new THREE.Group();
scene.add(buildingGroup);

models.load(function() {

  Building.setModels(_.mapObject(models.cache, function(model) {
    return model.toJSON();
  }));

  var building = {
    width: 3,
    height: 3,
    depth: 3,

    amplitude: 1,
    frequency: 0.08,
    octaves: 16,
    persistence: 0.5,

    heightDampener: 0.125,

    solidChance: 0.65,
    roofPointChance: 0.6,
    wallWindowChance: 0.3,
    wallDoorChance: 0.1,
    bannerChance: 0.1,
    shieldChance: 0.1,
    fenceChance: 0.4,

    seed: 0,

    debug: false,

    randomSeed: function() {
      building.seed = Math.round(Math.random() * 10000);
    },

    generate: function() {
      var options = _.omit(building, 'generate', 'randomSeed');
      buildingGroup.remove.apply(buildingGroup, buildingGroup.children);

      var func = _.bind(function(cb) {
        Building.generate(options, function(err, mesh) {
          buildingGroup.add(mesh);

          cb();
        });
      }, this);

      queue.push(func);

    } 
  };

  var gui = new Dat.GUI();
  gui.add(building, 'amplitude').min(0.02).max(1).step(0.02);
  gui.add(building, 'frequency').min(0.02).max(1).step(0.02);
  gui.add(building, 'octaves').min(1).max(64).step(1);
  gui.add(building, 'persistence').min(0).max(1);
  gui.add(building, 'heightDampener').min(0).max(1);
  
  gui.add(building, 'width').min(1).max(15).step(1);
  gui.add(building, 'height').min(1).max(15).step(1);
  gui.add(building, 'depth').min(1).max(15).step(1);

  gui.add(building, 'solidChance').min(0).max(1);
  gui.add(building, 'roofPointChance').min(0).max(1);
  gui.add(building, 'wallDoorChance').min(0).max(1);
  gui.add(building, 'wallWindowChance').min(0).max(1);
  gui.add(building, 'bannerChance').min(0).max(1);
  gui.add(building, 'shieldChance').min(0).max(1);
  gui.add(building, 'fenceChance').min(0).max(1);

  gui.add(building, 'seed').min(0).max(10000).step(1).listen();

  gui.add(building, 'debug');

  gui.add(building, 'randomSeed');
  gui.add(building, 'generate');
});

var render = function () {
  stats.begin();

  queue.start();

  controls.update();
  
  light.position.set(camera.position.x, camera.position.y, camera.position.z);

  renderer.render(scene, camera);
  
  stats.end();
  requestAnimationFrame(render);
};

render();