'use strict';
// var Q = require('q');
// let _ = require('lodash');
let Dialog = require('./dialog');

let greetingDialog = require('./greeting').instance;
let placeSearchDialog = require('./place-search').instance;

module.exports = class RootDialog extends Dialog {
  constructor() {
    super();
    this.addChild(greetingDialog);
    this.addChild(placeSearchDialog);
  }
  
  get defaultSubdialog() { return placeSearchDialog; }
};