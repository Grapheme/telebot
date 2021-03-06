'use strict';
let Singleton = require('../../lib/singleton');
let Node = require('../../lib/node');
// let mixin = require('es6-mixins');
let _ = require('lodash');


class Dialog {
  constructor() {
    _.extend(this, Node);
  }
  
  // get defaultSubdialog() { return d; }

  // response() { 
  //   return { 
  //     dialog: this, 
  //     responses:[] 
  //   }; 
  // }
}


Dialog.unknown = 'Ничего не понял';
Dialog.help = 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"';

module.exports = Dialog;
