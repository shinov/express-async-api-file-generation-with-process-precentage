const EventEmitter = require('events');
class MyEmitter extends EventEmitter {};
exports.progressProcessor = MyEmitter;