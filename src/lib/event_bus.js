const EventEmitter = require('node:events');

class ANPREvents extends EventEmitter{}
const eventBus = new ANPREvents();

module.exports = eventBus;