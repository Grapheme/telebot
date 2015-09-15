'use strict';

let Dialog = require('./dialog');
let _ = require('lodash');
// let PlaceSearch = require('./place-search');

module.exports = class NeedLocation extends Dialog { 
  constructor() {
    super();

    this.accept = ['location'];
    this.locationText = 'Поделись своим местоположением';

    // this.defaultSubdialog = PlaceSearch.instance;

    // console.log('sdsdsd', PlaceSearch, this.defaultSubdialog, this._parent);

    this.match = [
      '(недалек|ближай|рядом|вокруг|поблизост|около меня)\\S*'
    ];
  }

  onAdded() {
    this.defaultSubdialog = this._parent;
  }

  response() {
    return {
      dialog: this,

      responses: [{
        text: this.locationText
      }]
    };
  } 
};