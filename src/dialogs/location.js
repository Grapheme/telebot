'use strict';

let Dialog = require('./dialog');
// let _ = require('lodash');
let PlaceSearch = require('./place-search');
// let History = require('../history').instance;

module.exports = class Location extends Dialog { 
  constructor() {
    super();

    this.accept = ['location'];
    // this.defaultSubdialog = PlaceSearch.instance;
    // console.log('sdsdsd', PlaceSearch, this.defaultSubdialog, this._parent);
    // this.placeSearch = new PlaceSearch();
    // this.responseText = 'yess111';
  }

  response(message, meta) {
    // return History.last({ meta: { seach: true } })
    //   .then(function() {
    //     return placeSearch.response({ text: '' , userId: '' });
    //   });
  } 
};