'use strict';

let Dialog = require('../dialog');
// let _ = require('lodash');
let positive = require('./place-found/positive').instance;
let negative = require('./place-found/negative').instance;

module.exports = class PlaceFound extends Dialog { 
  constructor() {
    super();

    this.addChild(negative);
    this.addChild(positive);

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
    // console.log('sdsd path', this.getPath());

    return {
      dialog: this,
      responses: [{ text: this.placeText(place) }, { image: place.coverImage() }]
    };
  }

  // response() {
    
  // } 
};