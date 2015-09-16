'use strict';

let Singleton = require('../lib/singleton');
let Datastore = require('nedb');

module.exports = class History extends Singleton {
  constructor() {
    super();
    this.db = new Datastore(); //{ filename: 'path/to/datafile', autoload: true }
  }

  last(query, func) {
    return this.db.find(query)
      .sort({ time: -1 })
      .limit(1)
      .exec(func);
  }

  lastOutgoingMessage(userId, func) {
    return this.last({ userId: userId, type: 'outgoing' }, func);
  }

  // location last 30 min
  lastLocationMessage(userId, func) {
    return this.last({ userId: userId, type: 'incoming', time: { $gt: Date.now() - 30 * 60 * 1000 }, location: { $exists: true } }, func);
  }

  // place last 5 min 
  lastPlaceMessage(userId, func) {
    return this.last({ userId: userId, type: 'outgoing', time: { $gt: Date.now() - 5 * 60 * 1000 }, meta: {  place: { $exists: true } } }, func); 
  }

  lastIncomingTextMessage(userId, func) {
    return this.last({ userId: userId, type: 'incoming', text: { $regex: /.+/im }}, func);
  }

  insert() {
    this.db.insert.apply(this.db, arguments);
  }
};