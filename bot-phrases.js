'use strict';

module.exports = {
  greetings: [
    'Привет!'
  ],

  offtopic: [
    'Всё отлично 👌'
  ],

  callsToAction: [
    'Что для тебя найти?',
    'Что я могу для тебя найти?',
    'Чем я могу тебе помочь?',
  ],

  result: function(place) {
    let text = [];
    text.push('Я нашел для вас это место:');
    text.push(`${ place.mainCategoryName } "${ place.name }"`);
    text.push(place.address);
    text.push(place.link);
    return text;
  },

  notFound: [
    'Не нашел ничего 😪'
  ],

  help: 'Я понимаю простые команды, например "найди парк горького" или "покажи старбакс"'



};