'use strict';

var THREE     = require('three');
var Stats     = require('stats.js');
var queue     = require('../util/queue');

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
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

var light = new THREE.AmbientLight(0x222222);
scene.add(light);

var light = new THREE.PointLight( 0xffffff, 0.8, 1000 );
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

var axis = new THREE.AxisHelper(15);
scene.add(axis);

var render = function () {
  stats.begin();

  queue.start();

  controls.update();
  
  light.position.set(camera.position.x, camera.position.y, camera.position.z);

  renderer.render(scene, camera);
  
  stats.end();
  requestAnimationFrame(render);
};

exports.scene = scene;
exports.render = render;
exports.start = function() {
  render();
};