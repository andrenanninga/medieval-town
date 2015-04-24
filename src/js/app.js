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
camera.position.x = 25;
camera.position.y = 25;

var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

models.load();

var lights = [ [100, 100, 100], [100, 100, -100], [-100, 100,  -100], [-100, 100, 100], [0, -100, 0] ];

for(var i = 0; i < lights.length; i++) {
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( lights[i][0], lights[i][1], lights[i][2] );
  directionalLight.target.position.set(0, -50, 0);
  scene.add( directionalLight );
}

setTimeout(function() {
  var m = 0;
  for(var i = -2; i <= 2; i++) {
    for(var j = -2; j <= 2; j++) {
      new Building(scene, i*3*4, j*3*4, 3, 3, 3).generate();
    }
  }
}, 4000);

// var building = new Building(scene, 0, 0, 3, 3, 3);
// console.log(building);

// window.onload =function() {
//   var gui = new Dat.GUI();
//   gui.add(building, 'amplitude').min(0.02).max(1).step(0.02);
//   gui.add(building, 'frequency').min(0.02).max(1).step(0.02);
//   gui.add(building, 'octaves').min(1).max(64).step(1);
//   gui.add(building, 'persistence').min(0).max(1);
//   gui.add(building, 'heightDampener').min(1).max(16);
  
//   gui.add(building, 'width').min(1).max(15).step(1);
//   gui.add(building, 'height').min(1).max(15).step(1);
//   gui.add(building, 'depth').min(1).max(15).step(1);

//   gui.add(building, 'roofPointChance').min(0).max(1);
//   gui.add(building, 'wallDoorChance').min(0).max(1);
//   gui.add(building, 'wallWindowChance').min(0).max(1);
//   gui.add(building, 'bannerChance').min(0).max(1);
//   gui.add(building, 'shieldChance').min(0).max(1);
//   gui.add(building, 'generate');
// };

var render = function () {
  requestAnimationFrame(render);

  controls.update();
  renderer.render(scene, camera);
};

render();