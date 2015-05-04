'use strict';

var Queue = require('queue');

if(!global.queue) {
  global.queue = Queue();
  global.queue.concurrency = 2;
}

module.exports = global.queue;