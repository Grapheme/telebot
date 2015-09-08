'use strict';
// var Q = require('q');
var _ = require('lodash');

module.exports = {
  accept: ['text'],

  priority: 1,
  match: [
    'test',
    '(привет|здоров\\S*|здаров\\S*)',
    'здрав\\S*',
    'добр\\S*\\s*((ден|дн|ноч)\\S*)?',

  ].join('|').replace(/(.*)/,'($1)'),

  responses: {
    MORNING: {
      phrases: ['Доброе утро, слушаю внимательно'],
      choices: [
        'Место для завтрака',
        'Где выпить кофе',
        'Новое заведение',
        'Лучшее вокруг',
      ]
    },

    NOON: {
      phrases: ['Привет, чем могу помочь?'],
      choices: [
        'Место для обеда',
        ['Бизнес-ланч','Кофе'],
        'Новое заведение',
        'Лучшее вокруг',
      ]
    },

    EVENING: {
      phrases: ['Приветствую, тебя человек.\nЧто я могу найти для тебя?'],
      choices: [
        'Место для ужина',
        'Отличные бары',
        'Новое заведение',
        'Лучшее вокруг',
      ]
    },

    HOLIDAY_MORNING: {
      phrases: ['Привет, что я могу сделать для тебя в это чудесное утро?'],
      choices: [
        'Mесто для завтрака',
        'Кофе','Бранч',
        'Новое заведение',
        'Лучшее вокруг',
      ]
    }
  },

  // callsToAction: [
  //   'Чего желаете?',
  //   'Что для тебя найти?',
  //   'Что я могу для тебя найти?',
  //   'Чем я могу тебе помочь?',
  //   'Что будем искать?'
  // ],

  response: function(message) {
    let day = (new Date()).getDay();
    let time = (new Date()).getHours();

    let type = 'NOON';
    if (time >= 3 && time < 12) type = 'MORNING';
    if (time >= 12 && time < 17) type = 'NOON';
    if (time >= 17 && time < 23) type = 'EVENING';
    if (type === 'MORNING' && _.include([0,6], day)) type = 'HOLIDAY_MORNING';

    let r = this.responses[type];
    
    return {
      text: _.sample(r.phrases),
      choices: r.choices
    };
  }
};


