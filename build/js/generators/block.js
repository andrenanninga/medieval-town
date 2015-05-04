/* global _ */
/* global operative */
/* global THREE */
/* global SAT */
'use strict';

var Building = require('./building');
var async = require('async');

require('../plugins/ObjectLoader');

var loader = new THREE.ObjectLoader();

var templates = {
  standard: {
    squareSize: 3,
    depth: 4,
    
    debug: true,
    debugPolygon: true,
    debugGrid: true,
    debugSections: true,

    building: Building.templates.standard
  }
};

var scripts = [
  'js/lib/underscore.js',
  'js/lib/three.js',
  'js/lib/SAT.js',
  'js/lib/ObjectLoader.js',
];

var worker = operative({

  index: 0,

  models: {},

  setModels: function(models, callback) {
    callback = callback || _.noop;

    var loader = new THREE.ObjectLoader();

    this.models = _.chain(models)
      .mapObject(function(model) {
        return loader.parse(model);
      })
      .value();

    callback(null);
  },

  getGrid: function(points, options, callback) {
    this.options = options;

    var grid = [];

    for(var i = 0; i < points.length; i++) {
      var start = points[i];
      var end = (i < points.length - 1) ? points[i + 1] : points[0];

      start = new THREE.Vector3(start[0], 0, start[1]);
      end = new THREE.Vector3(end[0], 0, end[1]);

      var edgeGrid = this._getGridOnEdge(i, start, end);
      grid.push(edgeGrid);
    }

    grid = _.flatten(grid);
    grid = this._filterGridOutside(points, grid);
    grid = this._filterGridOverlap(grid);

    callback(null, grid);
  },

  _getGridOnEdge: function(edge, start, end) {
    var grid = [];

    var distance = start.distanceTo(end);
    var normal = end.clone().sub(start).normalize();
    var perpendicular = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    var angle = normal.angleTo(new THREE.Vector3(0, 0, (normal.x < 0) ? 1 : -1));
    var otherAngle = normal.angleTo(new THREE.Vector3(0, 0, (normal.x < 0) ? -1 : 1));

    if(normal.x < 0) {
      otherAngle -= Math.PI;
    }

    var squareSize = this.options.squareSize;
    var depth = this.options.depth;

    var halfSquare = squareSize / 2;
    var widthStart = halfSquare;
    var widthEnd = distance - widthStart * 2;
    var depthStart = halfSquare;
    var depthEnd = depth * squareSize + depthStart;

    var column = 0;

    for(var i = widthStart; i < widthEnd; i += squareSize) {
      var row = 0;

      for(var j = depthStart; j < depthEnd; j += squareSize) {

        var position = start.clone()
          .add(normal.setLength(i))
          .add(perpendicular.setLength(j + 0.005));

        var square = new SAT.Polygon(new SAT.Vector(0, 0), [
          new SAT.Vector(-halfSquare, -halfSquare),
          new SAT.Vector(+halfSquare, -halfSquare),
          new SAT.Vector(+halfSquare, +halfSquare),
          new SAT.Vector(-halfSquare, +halfSquare)
        ]);

        square.setOffset(new SAT.Vector(position.x, position.z));
        square.rotate(angle);

        square.a = otherAngle;

        square.edge = edge;
        square.row = row;
        square.column = column;

        grid.push(square);

        row += 1;
      }

      column += 1;
    }

    return grid;
  },

  _filterGridOutside: function(points, grid) {
    var newGrid = [];
    var response = new SAT.Response();
    var polygon = new SAT.Polygon(
      new SAT.Vector(0, 0), 
      _.map(points, function(point) { 
        return new SAT.Vector(point[0], point[1]); 
      })
    );

    for(var i = 0; i < grid.length; i++) {
      var square = grid[i];

      var collided = SAT.testPolygonPolygon(square, polygon, response);

      if(collided && response.aInB) {
        newGrid.push(square);
      }

      response.clear();
    }

    return newGrid;
  },

  _filterGridOverlap: function(grid) {
    var removals = [];

    for(var i = 0; i < grid.length - 1; i++) {
      for(var j = i + 1; j < grid.length; j++) {
        var square1 = grid[i];
        var square2 = grid[j];

        if(square1.edge === square2.edge) {
          continue;
        }

        if(SAT.testPolygonPolygon(square1, square2)) {
          if(square1.column >= square2.column) {
            removals.push(i);
          }
          else {
            removals.push(j);
          }
        }
      }
    }

    removals = _.uniq(removals);
    var newGrid = _.filter(grid, function(square, i) {
      return !_.contains(removals, i);
    });

    return newGrid;
  },

  getSections: function(points, grid, options, callback) {
    var filterEdge = function(edge) { 
      return function(square) { return square.edge === edge; }; 
    };
    var filterColumn = function(column) { 
      return function(square) { return square.column === column; }; 
    };

    var groups = [];
    var sections = [];

    for(var i = 0; i < points.length; i++) {
      var squares = _.filter(grid, filterEdge(i));
      var columns = _.chain(squares).pluck('column').uniq().value();
      var lastColumnSize = -1;
      var group = null;

      for(var j = 0; j < columns.length; j++) {
        var column = _.filter(squares, filterColumn(columns[j]));

        if(column.length !== lastColumnSize || group.length >= 7) {
          if(group) {
            groups.push(_.flatten(group));
          }

          group = [];
        }

        group.push(column);
        lastColumnSize = column.length;
      }

      if(group) {
        groups.push(_.flatten(group));
      }
    }

    for(var i = 0; i < groups.length; i++) {
      var group = groups[i];
      var columns = _.chain(group).pluck('column').uniq().value().length;
      var rows = _.chain(group).pluck('row').uniq().value().length;

      var minX = Number.MAX_SAFE_INTEGER;
      var maxX = Number.MIN_SAFE_INTEGER;
      var minY = Number.MAX_SAFE_INTEGER;
      var maxY = Number.MIN_SAFE_INTEGER;

      var section= { 
        x: 0, 
        y: 0,
        width: rows * options.squareSize,
        depth: columns * options.squareSize,
        angle: group[0].a
      };

      for(var j = 0; j < group.length; j++) {
        var pos = group[j].offset;

        if(pos.x < minX) {
          minX = pos.x;
        }
        if(pos.x > maxX) {
          maxX = pos.x;
        }
        if(pos.y < minY) {
          minY = pos.y;
        }
        if(pos.y > maxY) {
          maxY = pos.y;
        }
      }

      section.x = (minX + maxX) / 2;
      section.y = (minY + maxY) / 2;

      sections.push(section);
    }

    callback(null, sections);  
  },

  debug: function(points, grid, sections, options, callback) {
    var group = new THREE.Group();

    if(options.debugPolygon) {
      group.add(this._debugPolygon(points));
    }
    if(options.debugGrid) {
      group.add(this._debugGrid(grid));
    }
    if(options.debugSections) {
      group.add(this._debugSections(sections, options));
    }

    group.updateMatrixWorld();

    callback(null, group.toJSON());
  },

  _debugPolygon: function(points) {
    var i;
    var geometry = new THREE.Geometry();
    var material = new THREE.MeshBasicMaterial({ color: 0xFF1493, wireframe: true, name: 'Debug' });
    var mesh = new THREE.Mesh(geometry, material);

    for(i = 0; i < points.length; i++) {
      geometry.vertices.push(new THREE.Vector3(points[i][0], 0, points[i][1]));
    }

    for(i = 0; i < points.length - 2; i++) {
      var face = new THREE.Face3(0, i + 1, i + 2);
      face.normal.z = 1;
      geometry.faces.push(face);
    }

    return mesh;
  },

  _debugGrid: function(grid) {

    var group = new THREE.Group();
    var material = new THREE.MeshBasicMaterial({ color: 0xFF1493, wireframe: true, name: 'Debug' });

    for(var j = 0; j < grid.length; j++) {
      var square = grid[j];

      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(square.calcPoints[0].x, 0, square.calcPoints[0].y));
      geometry.vertices.push(new THREE.Vector3(square.calcPoints[1].x, 0, square.calcPoints[1].y));
      geometry.vertices.push(new THREE.Vector3(square.calcPoints[2].x, 0, square.calcPoints[2].y));
      geometry.vertices.push(new THREE.Vector3(square.calcPoints[3].x, 0, square.calcPoints[3].y));

      geometry.faces.push(new THREE.Face3(0, 1, 2));
      geometry.faces.push(new THREE.Face3(0, 2, 3));

      geometry.faces[0].normal = new THREE.Vector3(0, 1, 0);
      geometry.faces[1].normal = new THREE.Vector3(0, 1, 0);

      var mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    }

    return group;
  },

  _debugSections: function(sections, options) {

    var group = new THREE.Group();
    var material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true, name: 'Debug' });

    for(var i = 0; i < sections.length; i++) {
      var section = sections[i];

      var geometry = new THREE.BoxGeometry(section.width, 0.0001, section.depth);
      var mesh = new THREE.Mesh(geometry, material);
      
      mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), section.angle);

      mesh.position.x = section.x;
      mesh.position.z = section.y;
      
      group.add(mesh);
    }

    return group;
  },
}, scripts);

var Block = {
  templates: templates,

  generate: function(points, options, callback) {
    var settings = {};

    settings = _.extend({}, templates.standard, _.omit(options, 'building'));
    settings.building = _.extend({}, Building.templates.standard, options.building);

    callback = callback || _.noop;

    var result = {};
    var saveResult = function(key, cb) {
      return function(err, value) {
        result[key] = value;
        cb(err, value);
      };
    };

    async.series({
      
      grid: function(cb) {
        worker.getGrid(points, settings, saveResult('grid', cb));
      },

      sections: function(cb) {
        worker.getSections(points, result.grid, settings, saveResult('sections', cb));
      },

      debug: function(cb) {
        worker.debug(points, result.grid, result.sections, settings, cb);
      }

    }, function(err, result) {
      var group = new THREE.Group();
      
      var debugMesh = loader.parse(result.debug);

      group.add(debugMesh);

      callback(null, group);
    });

    // worker.generate(options, callback);
  },

  setModels: function(models, callback) {
    worker.setModels(models, callback);
  },

  getModels: function(callback) {
    worker.getModels(callback);
  }
};

module.exports = Block;