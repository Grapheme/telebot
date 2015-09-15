'use strict';
// var Q = require('q');
// let _ = require('lodash');
let Dialog = require('./dialog');

let Greeting = require('./greeting');
let PlaceSearch = require('./place-search');

module.exports = class RootDialog extends Dialog {
  constructor() {
    super();
    this.ps = new PlaceSearch();
    this.addChild(new Greeting());
    this.addChild(this.ps);
  }
  
  get defaultSubdialog() { return this.ps; }
};