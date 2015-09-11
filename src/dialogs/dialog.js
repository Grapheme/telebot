'use strict';
let Singleton = require('../../lib/singleton');
let Node = require('../../lib/node');
// let mixin = require('es6-mixins');
let _ = require('lodash');


class Dialog extends Singleton {
  constructor() {
    super();
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


Dialog.unkonwnPhrase = 'Ничего не понял';
Dialog.help = 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"';

module.exports = Dialog;
