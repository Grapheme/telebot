'use strict';

let Dialog = require('./dialog');
let _ = require('lodash');

module.exports = class Positive extends Dialog { 
  constructor() {
    super();

    // this.addChild(negative);
    // this.addChild(positive);
    // this.accept = ['text'];

    this.match = ['да\\, отлично', 'супер', 'да']; 

    this.r1 = [
      'Супер', 
      'Я рад)))',
      'Хорошо, я рад'
    ];

    this.r2 = [
      'Чем еще могу быть полезен?',
      'Чем еще могу помочь?',
      'Могу еще что-то сделать для тебя?'
    ];

    this.label = 'Да, отлично';
  }

  response() {
    return {
      dialog: this,
      responses: [{
        text: _.sample(this.r1)
      },
      {
        text: _.sample(this.r2)
      }]
    };
  } 
};