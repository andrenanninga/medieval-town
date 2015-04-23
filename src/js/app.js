'use strict';

var _        = require('underscore');
var THREE    = require('three');
var Dat      = require('dat-gui');
var models   = require('./models');

var Building = require('./building/building');

global.THREE = THREE;

require('./plugins/MTLLoader');
require('./plugins/OBJMTLLoader');
require('./plugins/OrbitControls');

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.x = 5;
camera.position.y = 5;

var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

models.load();

var lights = [ [10, 10, 10], [10, 10, -10], [-10, 10,  -10], [-10, 10, 10], [0, -10, 0] ];

for(var i = 0; i < 5; i++) {
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( lights[i][0], lights[i][1], lights[i][2] );
  directionalLight.target.position.set(0, 0, 0);
  scene.add( directionalLight );
}

var building = new Building(scene, 0, 0);

window.onload =function() {
  var gui = new Dat.GUI();
  gui.add(building.noiseGen, 'frequency').min(0).max(1).step(0.02);
  gui.add(building.noiseGen, 'octaves').min(1).max(64).step(1);
  gui.add(building, 'generate');
};

var render = function () {
  requestAnimationFrame(render);

  controls.update();
  renderer.render(scene, camera);
};

render();