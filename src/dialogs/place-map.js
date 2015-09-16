'use strict';

let Dialog = require('./dialog');
let History = require('../history').instance;
let localWay = require('../localway-api').instance;

module.exports = class PlaceMap extends Dialog { 
  constructor() {
    super();

    this.accept = ['text'];
    this.match = [
      'на карте'
    ];
    this.label = 'На карте';
  }

  response(message, meta) {

    return History.last({ userId: message.userId, 'meta.place': { $exists: true } })
      .then(function(m) {
        return localWay.getObject(m.meta.place._id);
      })
      .then(function(place) {
        console.log('sdsd place!!!', place);

        return {
          dialog: this,
          responses: [{ text: 'Вот где это' }, { location: { lat: place.lat, lon: place.lon } }]
        };
      }.bind(this)); 
  }
};