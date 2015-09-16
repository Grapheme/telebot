'use strict';

let Dialog = require('./dialog');
// let _ = require('lodash');
let Positive = require('./positive');
let Negative = require('./negative');

module.exports = class PlaceFound extends Dialog { 
  constructor() {
    super();

    this.addChild(new Negative());


    let p = new Positive();
    // choices: [
    //   'Показать отзывы',
    //   'Забронировать столик',
    //   'Еще фото',
    //   'На карте'
    // ]

    this.addChild(p);

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

  response(message, meta) {
    return meta.place.coverImage()
      .then(function(image) {
      
      return {
        dialog: this,
        meta: { place: meta.place },
        responses: [{ text: this.placeText(meta.place) }, { image: image }]
      };
    }.bind(this));  
  }

  // response() {
    
  // } 
};