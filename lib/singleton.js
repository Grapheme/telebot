'use strict';

module.exports = class Singleton {
  constructor() {}

  static get instance() {
    return this._instance || (this._instance = new this());
  }
};