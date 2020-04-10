const EventEmitter = require('events');
console.warn('Creating new bus');
const bus = new EventEmitter();
module.exports = bus;