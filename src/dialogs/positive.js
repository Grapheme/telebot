'use strict';

let Dialog = require('./dialog');

module.exports = class Positive extends Dialog { 
  constructor() {
    super();

    // this.addChild(negative);
    // this.addChild(positive);
    // this.accept = ['text'];

    this.match = ['да\\, отлично', 'супер']; 

    this.label = 'Да, отлично';
  }

  response() {
    return {
      dialog: this,
      responses: [{
        text: 'Рад был'
      }]
    };
  } 
};