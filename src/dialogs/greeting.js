'use strict';
// var Q = require('q');
let _ = require('lodash');
let Dialog = require('./dialog');
let PlaceSearch = require('./place-search');

let responses = {
  MORNING: {
    phrases: [['Доброе утро','cлушаю внимательно']],
    
    choices: [
      'Место для завтрака',
      'Где выпить кофе',
      'Новое заведение',
      'Лучшее вокруг',
    ]
  },

  NOON: {
    phrases: [['Привет','Чем могу помочь?']],
    choices: [
      'Место для обеда',
      ['Бизнес-ланч','Кофе'],
      'Новое заведение',
      'Лучшее вокруг',
    ]
  },

  EVENING: {
    phrases: [['Приветствую, тебя человек.', 'Что я могу найти для тебя?']],
    choices: [
      'Место для ужина',
      'Отличные бары',
      'Новое заведение',
      'Лучшее вокруг',
    ]
  },

  HOLIDAY_MORNING: {
    phrases: [['Привет!','Что я могу сделать для тебя в это чудесное утро?']],
    choices: [
      'Mесто для завтрака',
      'Кофе','Бранч',
      'Новое заведение',
      'Лучшее вокруг',
    ]
  }
};

module.exports = class Greeting extends Dialog {
  constructor() {
    super();
    
    this.accept = ['text'];

    this.defaultSubdialog = new PlaceSearch();
  }

  get match() { return [
      'test',
      '(привет|здоров\\S*|здаров\\S*)',
      'здрав\\S*',
      'добр\\S*\\s*((ден|дн|ноч)\\S*)?',
    ];
  }
  
  // callsToAction: [
  //   'Чего желаете?',
  //   'Что для тебя найти?',
  //   'Что я могу для тебя найти?',
  //   'Чем я могу тебе помочь?',
  //   'Что будем искать?'
  // ],

  getChildren() {
    // let r = responses[this.getResponseType()];
    //
  }

  getResponseType() {
    let day = (new Date()).getDay();
    let time = (new Date()).getHours();
    let type = 'NOON';
    if (time >= 3 && time < 12) type = 'MORNING';
    if (time >= 12 && time < 17) type = 'NOON';
    if (time >= 17 && time < 23) type = 'EVENING';
    if (type === 'MORNING' && _.include([0,6], day)) type = 'HOLIDAY_MORNING';
    return type;
  }

  response(message) {
    let r = responses[this.getResponseType()];
    let result = {
      dialog: this,
      responses: _.map(_.sample(r.phrases), function(s) { return { text: s }; })
    };

    _.last(result.responses).choices = r.choices;
    
    return result;
  }
};


