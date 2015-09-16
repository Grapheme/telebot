'use strict';

let Dialog = require('./dialog');
// let _ = require('lodash');
let Positive = require('./positive');
let Negative = require('./negative');

let PlaceMap = require('./place-map');
let PlacePhotos = require('./place-photos');
let PlaceReserve = require('./place-reserve');
let PlaceReviews = require('./place-reviews');

module.exports = class PlaceFound extends Dialog { 
  constructor() {
    super();

    let p = new Positive();
    p.addChild(new PlaceReviews());
    p.addChild(new PlaceReserve());
    p.addChild(new PlaceMap());
    p.addChild(new PlacePhotos());

    this.addChild(p);

    let n = new Negative();
    //
    this.addChild(n);    
  }

  placeText(place) {
    let text = [];
    // text.push('Я нашел для вас это место:');
    text.push(`${ place.mainCategoryName } "${ place.name }"`);
    text.push(place.address);
    text.push(place.link);
    // text.push(place.image);
    return text;
  }

  response(message, meta) {
    return meta.place.coverImage()
      .then(function(image) {
      
      return {
        dialog: this,
        meta: { place: { _id: meta.place._id } },
        responses: [{ text: this.placeText(meta.place) }, { image: image }]
      };
    }.bind(this));  
  }

  // response() {
    
  // } 
};