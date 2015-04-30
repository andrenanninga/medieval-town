/* global _ */
/* global operative */
/* global THREE */
/* global SAT */

'use strict';

var BlockWorker = operative({
  getGrid: function(points, callback) {
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

    var squareSize = 3;
    var depth = 3;

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

  getSections: function(points, grid, callback) {
    var filterEdge = function(edge) { 
      return function(square) { return square.edge === edge; }; 
    };
    var filterColumn = function(column) { 
      return function(square) { return square.column === column; }; 
    };

    var sections = [];

    for(var i = 0; i < points.length; i++) {
      var squares = _.filter(grid, filterEdge(i));
      var columns = _.chain(squares).pluck('column').uniq().value();
      var lastColumnSize = -1;
      var section = null;

      for(var j = 0; j < columns.length; j++) {
        var column = _.filter(squares, filterColumn(columns[j]));

        if(column.length !== lastColumnSize || section.length >= 7) {
          if(section) {
            sections.push(_.flatten(section));
          }

          section = [];
        }

        section.push(column);
        lastColumnSize = column.length;
      }

      if(section) {
        sections.push(_.flatten(section));
      }
    }

    callback(null, sections);  
  }
}, [
  'js/lib/underscore.js',
  'js/lib/three.js',
  'js/lib/sat.js',
]);

module.exports = BlockWorker;