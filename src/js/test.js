'use strict';

var _ = require('underscore');

var calculator = operative({
  add: function(a, b, callback) {
    _.times(b, function() {
      a += 1;
    });

    callback(a);
  },
}, ['js/lib/underscore.js']);

console.time('add');
calculator.add(1, 3, function(result) {
  console.timeEnd('add');
  console.log(result);
});