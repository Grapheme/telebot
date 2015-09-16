'use strict';

let Dialog = require('./dialog');

module.exports = class PlacePhotos extends Dialog { 
  constructor() {
    super();

    this.accept = ['text'];
    this.match = [
      'фото'
    ];
    this.label = 'Еще фото';
  }

  response(message, meta) {
    // return meta.place()
    //   .then(function(image) {
      
    //   return {
    //     dialog: this,
    //     meta: { place: meta.place },
    //     responses: [{ text: this.placeText(meta.place) }, { image: image }]
    //   };
    // }.bind(this));  
  }
};