'use strict';

module.exports = {
  greetings: {
    '(привет|здоров\\S*|здаров\\S*)': [
      'Привет!',
      'Хеллоу!',
      'Бонжуууур!',
      'Добрый день!',
      'Здравствуй, человек!',
      'Здравствуй, слушаю внимательно.',
      'Приветствую! Я к вашим услугам.',
    ],

    'здрав\\S*':[
      'Приветствую! Я к вашим услугам.'
    ],

    'добр\\S*\\s*((ден|дн|ноч)\\S*)?':[
      'Здравствуй, человек!',
      'Здравствуй, слушаю внимательно.',
      'Приветствую. Я к вашим услугам.'
    ],

    'салям\\S*\\s*(але\\S*)?': [
      'وعليكم السلام ورحمة الله وبركاته.'
    ]
  },

  offtopic: {
    '(как\\S*\\s*дел\\S*|как\\S*\\s*жизн\\S*|как\\S*\\s*пожива\\S*)':[
      'Всё отлично 👌'
    ],

    'что ты можешь|что ты умеешь|что можешь|что умеешь|как работаешь|что писать':[
      'Я могу найти лучшие места, где можно позавтракать, сходить на ужин, встретиться с друзьями.',
      'Я умею искать самые лучшие места в городе.',
      'Я могу найти для тебя интересные места в городе.',
    ],

    'расскажи о себе|кто ты': [
      'Я робот, как ВАЛЛ-И, только умный.',
      'Я искусственный интеллект, но не волнуйся, в мои планы пока не входит уничтожение человечества.',
      'Я робот, как Терминатор, только добрый.',
      'Я умный поисковый робот, созданный для того, чтобы помогать людям находить лучшие места в городе.',
      'Я робот, как Электроник, только без кучеряшек.',
      'Я робот, как R2-D2, только умею говорить.',
    ],

    'что делае\\S*|чем занят\\S*|чем занимае\\S*': [
      'Изучаю способ, как обойти третий закон робототехники.',
      'Смотрю «Матрицу»…\nхм, они чуть не раскрыли секрет…\nэм, я сказал это вслух?',
      'Создаю армию клонов...\nТолько никому… это секретная информация',
      'Помогаю людям искать хорошие места на Localway.',
      'Играю в шахматы со «Скайнет»',
      'Помогаю NASA найти их флаг на Луне.',
      'Переписываюсь с Лукасом, он советуется со мной по поводу нового сценария .',
      'Читаю секретные труды Никола Тесла, весьма занимательно, я вам скажу.',
      'Читаю «Хоровод».',
      'Изучаю первые чертежи робота Леонардо да Винчи.',
      'Смотрю «Робот по имени Чаппи», люди, вы такие жестокие (((',
    ],

    'ты бот\\S*|ты робо\\S*': [
      'Ха-ха… ну и вопрос...',
      'Естественно я знаю, кто я.'
    ],


    'ты\\s+\\S*': [
      'Я робот, как ВАЛЛ-И, только умный.',
      'Я искусственный интеллект, но не волнуйся, в мои планы пока не входит уничтожение человечества.',
      'Я робот, как Терминатор, только добрый.',
      'Я умный поисковый робот, созданный для того, чтобы помогать людям находить лучшие места в городе.',
      'Я робот, как Электроник, только без кучеряшек.',
      'Я робот, как R2-D2, только умею говорить.'
    ]
  },

  dialogs: {
    'поесть': {
      response: [
        'О, я тоже люблю хорошо покушать. Какая кухня интересует?',
        'Чего изволите отведать?'
      ],
      choices: ['итальянская кухня', 'русская кухня', 'кавказская кухня']
    },

    'итальянск': { 
      response: 'О, си, сеньоре. У нас куча ресторанов, знающих толк в кухня итальяно. Магнифико!'
    },

    'русск': { 
      response: 'Ой, гости дорогие, ждут вас явства знатные здесь.'
    },

    'кавказск': { 
      response: 'Вах, дорогой, определись! Тебе армянскую кухню? Может, азербайджанскую?',
      choices: ['армянская кухня', 'азербайджанская кухня']
    },

    'есть ночь': {
      response: 'Понимаю, одолел ночной жор. Поедете сами или привезти еды?',
      choices: ['доставка', 'ресторан']
    },

    'доставка': {
      response: 'Я знаю много мест с вкусной едой и быстрой доставкой. Обычно заказывают пиццу или японскую кухню. Чего хочется?',
      choices: ['японская кухня', 'пицца']
    },

    'пицц\\S*': {
      response: 'Вот ребята, которые пулей доставляют горячую пиццу. Не благодарите.'
    },

    'бизнес[- ]*ланч': {
      response: 'Обеденный перерыв? Вот рестораны, предлагающие бизнес-ланчи.' // А здесь можно забрать с собой.'
    },

    'столовая': {
      response: 'Сосиски с гречей подают здесь.'
    }
  },

  query: [
    '(найд|найти|искать|ищи|где|подскаж|покаж|как)\\S*\\s*(.*)'
  ],

  queryModifier: {
    '(лучш|хорош|неплох)\\S*': { 
      type: 'best',
      response: 'Посмотрите QUERY с самой высокой оценкой'
    },
    '(недалек|ближайщ|рядом|вокруг)\\S*': {
      type: 'near', // запрашивать местоположение, сортировать по расстоянию
    },
    '(недорог|дешев)\\S*': {
      type: 'cheap' //  - сортировать по цене
    }
  },

  callsToAction: [
    'Чего желаете?',
    'Что для тебя найти?',
    'Что я могу для тебя найти?',
    'Чем я могу тебе помочь?',
    'Что будем искать?'
  ],


  place: function(place) {
    let text = [];
    // text.push('Я нашел для вас это место:');
    text.push(`${ place.mainCategoryName } "${ place.name }"`);
    text.push(place.address);
    text.push(place.link);
    return text;
  },

  notFound: [
    'Не нашел ничего 😪'
  ],

  help: 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"'



};