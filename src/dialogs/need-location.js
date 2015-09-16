'use strict';

let Dialog = require('./dialog');
// let _ = require('lodash');
let Location = require('./location');

module.exports = class NeedLocation extends Dialog { 
  constructor(options) {
    super();

    if (!options) options = {};

    // this.accept = ['location'];
    this.locationText = 'Поделись своим местоположением';

    // this.defaultSubdialog = PlaceSearch.instance;

    // console.log('sdsdsd', PlaceSearch, this.defaultSubdialog, this._parent);

    this.match = [
      '(недалек|ближай|рядом|вокруг|поблизост|около меня)\\S*'
    ];

    let l = new Location();
    l.response = options.onLocation;

    this.unknown = 'Не смог разобрать где ты.';
    this.help = this.locationText;

    this.addChild(l);
  }

  // onAdded() {
  //   this.defaultSubdialog = this._parent;
  // }

  response(message, meta) {
    return {
      dialog: this,

      meta: meta,

      responses: [{
        text: this.locationText,
      }]
    };
  } 
};