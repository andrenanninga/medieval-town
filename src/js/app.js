'use strict';

var _        = require('underscore');
var THREE    = require('three');
var Stats    = require('stats.js');
var Chance   = require('chance');
var Dat      = require('dat-gui');
var models   = require('./models');

var Building = require('./building/building');

var chance = Chance();
global.THREE = THREE;

require('./plugins/MTLLoader');
require('./plugins/OBJMTLLoader');
require('./plugins/OrbitControls');

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xf0f0f0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.x = 25;
camera.position.y = 25;

var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

var light = new THREE.AmbientLight(0x333333);
scene.add( light );

var light = new THREE.PointLight( 0xffffff, 0.8, 1000 );
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

models.load(function() {
  // setTimeout(function() {
  //   var n = function() {
  //     return chance.integer({ min: -2, max: 1});
  //   };

  //   for(var i = -6; i <= 6; i++) {
  //     for(var j = -6; j <= 6; j++) {
  //       new Building(scene, i*3*6, j*3*6, 4 + n(), 4 + n(), 4 + n()).generate();
  //     }
  //   }
  // }, 2000);

  var building = new Building(scene, 0, 0, 4, 3, 4);
  building.generate();

  var gui = new Dat.GUI();
  gui.add(building, 'amplitude').min(0.02).max(1).step(0.02);
  gui.add(building, 'frequency').min(0.02).max(1).step(0.02);
  gui.add(building, 'octaves').min(1).max(64).step(1);
  gui.add(building, 'persistence').min(0).max(1);
  gui.add(building, 'heightDampener').min(1).max(16);
  
  gui.add(building, 'width').min(1).max(15).step(1);
  gui.add(building, 'height').min(1).max(15).step(1);
  gui.add(building, 'depth').min(1).max(15).step(1);

  gui.add(building, 'roofPointChance').min(0).max(1);
  gui.add(building, 'wallDoorChance').min(0).max(1);
  gui.add(building, 'wallWindowChance').min(0).max(1);
  gui.add(building, 'bannerChance').min(0).max(1);
  gui.add(building, 'shieldChance').min(0).max(1);
  gui.add(building, 'fenceChance').min(0).max(1);

  gui.add(building, 'generate');
});

var render = function () {
  stats.begin();

  controls.update();
  
  light.position.set(camera.position.x, camera.position.y, camera.position.z);

  renderer.render(scene, camera);
  
  stats.end();
  requestAnimationFrame(render);
};

render();