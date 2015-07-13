'use strict';

var _         = require('underscore');
var THREE     = require('three');
var Stats     = require('stats.js');
var Dat       = require('dat-gui');
var models    = require('../models');

var Building  = require('../model/building');

global.Building = Building;
global.THREE = THREE;

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
stats.domElement.style.bottom = '0px';
document.body.appendChild(stats.domElement);

var light = new THREE.AmbientLight(0x222222);
scene.add(light);

var light = new THREE.PointLight( 0xffffff, 0.8, 1000 );
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

var clock = new THREE.Clock();

var axis = new THREE.AxisHelper(15);
scene.add(axis);

var group = new THREE.Group();
scene.add(group);

var building;

models.load(function() {

  building = {
    options: Building.defaults,

    randomSeed: function() {
      building.options.seed = Math.round(Math.random() * 10000);
    },

    generate: function() {
      group.remove.apply(group, group.children);

      var build = new Building();
      build.generate(building.options, function(err, mesh) {
        group.add(mesh);
      });

    } 
  };

  var gui = new Dat.GUI();
  gui.add(building.options, 'amplitude').min(0.02).max(1).step(0.02);
  gui.add(building.options, 'frequency').min(0.02).max(1).step(0.02);
  gui.add(building.options, 'octaves').min(1).max(64).step(1);
  gui.add(building.options, 'persistence').min(0).max(1);
  gui.add(building.options, 'heightDampener').min(0).max(1);
  
  gui.add(building.options, 'width').min(1).max(15).step(1);
  gui.add(building.options, 'height').min(1).max(15).step(1);
  gui.add(building.options, 'depth').min(1).max(15).step(1);

  gui.add(building.options, 'solidChance').min(0).max(1);
  gui.add(building.options, 'roofPointChance').min(0).max(1);
  gui.add(building.options, 'wallDoorChance').min(0).max(1);
  gui.add(building.options, 'wallWindowChance').min(0).max(1);
  gui.add(building.options, 'bannerChance').min(0).max(1);
  gui.add(building.options, 'shieldChance').min(0).max(1);
  gui.add(building.options, 'fenceChance').min(0).max(1);

  gui.add(building.options, 'seed').min(0).max(10000).step(1).listen();

  gui.add(building.options, 'debug');

  gui.add(building, 'randomSeed');
  gui.add(building, 'generate');

  building.generate();
  render();
});

var last = -1;
var render = function () {
  stats.begin();

  controls.update();
  
  light.position.set(camera.position.x, camera.position.y, camera.position.z);

  renderer.render(scene, camera);

  group.rotation.y += 1 * clock.getDelta();

  if(Math.floor(clock.getElapsedTime()) > last) {
    last = clock.getElapsedTime();
    building.generate();
  }
  
  stats.end();
  requestAnimationFrame(render);
};