'use strict';

var _       = require('underscore');
var THREE   = require('three');
var objects = require('./objects');

global.THREE = THREE;

require('./plugins/MTLLoader');
require('./plugins/OBJMTLLoader');
require('./plugins/OrbitControls');


var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 10;

var loader = new THREE.OBJMTLLoader();

var lights = [
  [10, 10, 10],
  [10, 10, -10],
  [-10, 10,  -10],
  [-10, 10, 10],
  [0, -10, 0]
];

for(var i = 0; i < 5; i++) {
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( lights[i][0], lights[i][1], lights[i][2] );
  directionalLight.target.position.set(0, 0, 0);
  scene.add( directionalLight );
}

var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

_.each(objects, function(object, i) {
  var x = ((i % 10) * 5) - 25;
  var z = (Math.floor(i / 10) * 5) - 15;

  console.log(x, z);

  loader.load(
    'assets/models/' + object + '.obj',
    'assets/models/' + object + '.mtl',
    function(object) {
      object.position.x = x;
      object.position.z = z;
      scene.add(object);
    }
  );
});

var render = function () {
  requestAnimationFrame(render);

  controls.update();
  renderer.render(scene, camera);
};

render();