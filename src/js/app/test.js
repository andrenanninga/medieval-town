'use strict';

var Voronoi = require('voronoi');

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

function randRange(min, max) {
  var randomNum = (Math.random() * (max - min)) + min;
  return randomNum;
}

function randRangeBiased(min, max, bias) {
  var randomNum = (Math.pow(Math.random(), bias) * (max - min)) + min;
  return randomNum;
}

var radius = 400;
var bbox = { xl: 0, xr: 800, yt: 0, yb: 800 };
var points = [];

for(var i = 0; i < 100; i++){
  var dist = randRangeBiased(0, radius, 1.4);
  var angle = randRange(0, Math.PI * 2);
  
  var x = Math.cos(angle) * dist;
  var y = Math.sin(angle) * dist;

  if(x > -10 && x < 10 && y > -10 && y < 10) {
    continue;
  }

  x += 400;
  y += 400;

  points.push({ x: x, y: y });
}

var voronoi = new Voronoi();
var diagram = voronoi.compute(points, bbox);

var center = {
  x: 400 + randRange(-50, 50),
  y: 400 + randRange(-50, 50),
}

for(var i = 0; i < diagram.cells.length; i++) {
  var cell = diagram.cells[i];
  var points = [];

  for(var j = 0; j < cell.halfedges.length; j++) {
    var halfedge = cell.halfedges[j];
    
    points.push(halfedge.getStartpoint());
  }

  var x = center.x - cell.site.x;
  var y = center.y - cell.site.y;
  var distance = Math.sqrt(x*x + y*y);

  var sector = distance + Math.random() * 40;

  if(sector < 40) {
    context.fillStyle = 'red';
  }
  else if(sector < 160) {
    context.fillStyle = 'orange';
  } 
  else if(sector < 220) {
    context.fillStyle = 'blue';
  }
  else {
    context.fillStyle = 'green';
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for(var j = 1; j < points.length; j++) {
    context.lineTo(points[j].x, points[j].y);
  }

  context.closePath();
  context.stroke();
  context.fill();
}
