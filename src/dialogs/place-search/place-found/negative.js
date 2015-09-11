'use strict';

let Dialog = require('../../dialog');
let placeSearch = require('../../place-search').instance;

module.exports = class Negative extends Dialog { 
  constructor() {
    super();

    // this.addChild(negative);
    // this.addChild(positive);
    // this.accept = ['text'];
      
    this.match = ['Другое место', 'говно']; 

    this.label = 'Другое место';

    this.defaultSubdialog = placeSearch;
  }

  response(msg, history) {
    // dialog: 'PlaceSearch.PlaceFound' length 2
    // if text - place.search.response({ text: text }, history)
    

    return {
      dialog: this,
      responses: []
    };
  } 
};