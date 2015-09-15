'use strict';

let Dialog = require('./dialog');
// let _ = require('lodash');
let Positive = require('./positive');
let Negative = require('./negative');

module.exports = class PlaceFound extends Dialog { 
  constructor() {
    super();

    this.addChild(new Negative());
    this.addChild(new Positive());

    // this.accept = ['text'];
    // this.match = [
      // '(недалек|ближай|рядом|вокруг|поблизост|около меня)\\S*'
    // ];
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

  responseForPlace(place) {
    return place.coverImage()
      .then(function(image) {
      
      return {
        dialog: this,
        responses: [{ text: this.placeText(place) }, { image: image }]
      };
    }.bind(this));  
  }

  // response() {
    
  // } 
};