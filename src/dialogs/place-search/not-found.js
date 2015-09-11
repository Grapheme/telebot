'use strict';

let Dialog = require('../dialog');
let _ = require('lodash');


module.exports = class NotFound extends Dialog { 
  constructor() {
    super();

    this.notFound = [
      'Не нашел ничего 😪'
    ];

    this.help = 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"';
  }

  onAdded() {
    this.defaultSubdialog = this._parent;
  }


  response() {
    return {
      dialog: this,

      responses: [{
        text: [_.sample(this.notFound), this.help].join('\n')
      }]
    };
  }
};