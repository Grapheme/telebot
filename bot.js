'use strict';
var _ = require('lodash');
var async = require('async');


var Talk = require('./bot-talk');
var Datastore = require('nedb');
var dialogs = new Datastore(); //{ filename: 'path/to/datafile', autoload: true }

var Q = require('q');

module.exports = class Bot {
  constructor() {
    this.adapters = [];
  }

  addAdapter(a) {
    this.adapters.push(a);
  }

  adapterByUserId(userId) {
    return _.find(this.adapters, { type: userId.split(':')[0] });
  }

  start() {
    for (let a of this.adapters) {
      a.on('text', function() {
        try {
          this.onMessage.apply(this, arguments);
        } catch(e) {
          console.log('Error onMessage', e.stack);
        }

      }.bind(this));
      
      a.on('location', this.onLocation.bind(this));

      a.start();
      console.log('Bot started...');
    }
  }

  processMessageText (msg) {
    let text = msg.text;
    let reply = msg.reply;


    /*
    1
    привет -> func  текст меню

    2
    пицца рядом, обед поблизости -> запрос пицца, ждать геолокации, 'пришли место'
    если сообщение геолокация - то искать 
    если сообщение не геолокация - искать
    отправил место - клавиатура - жду ответа отлично отлично нет неи

    3
    ДА, ОТЛИЧНО - понравилось

    4
    ДРУГОЕ МЕСТО, нет, все плохо  - не понравивлось

    5
    НА КАРТЕ - последнке место и показывает на карте

    6
    ЕЩЕ ФОТО - последнее место и показывает его фотки

    7
    ЗАБРОНИРОВАТЬ СТОЛИК -- ищу последнее место даю ссылку на бронирование
     
    8 
    скажи как тебя зовут
    если следующее сообщение того
    если нет - пиздюк
    привет kk - (меня)?\s+?(зовут)?([^\.\,]+)

    
    9 ресторан парк покушать - обычный поиск
    
    */

    var deferred = Q.defer();

    let message = {
      original: text,
      query: '',
      modifiers: [],
      sorting: []
    };

    let matched;
    let dialog = _.find(Talk.dialogs, function(dialog) { 
      if (!_.isArray(dialog.match)) dialog.match = [dialog.match];
      for (let r of dialog.match) {
        let m = text.match(new RegExp(r, 'im'));
        if (m) {
          matched = r;
          return true;
        } 
      }
      return false;
    });

    if (!dialog) dialog = Talk.defaultDialog;

    let history = dialogs.find({ userId: msg.userId, time: { $gt: Date.now() - 30 * 60 * 1000 } });

    Q.when(dialog.response(message, matched, reply, history)).then(function(responses) {
      deferred.resolve(responses);
    });
    
    return deferred.promise;

    // for (let i = 0; i < response.length; i++) {
    //   response[i] = response[i].replace('QUERY', message.query);
    // }  
  }

  onMessage (msg) {
    console.log('on message', msg);

    this.processMessageText(msg).then(function(responses) {
      dialogs.insert({ 
        userId: msg.userId,
        time: Date.now(), 
        type: 'incoming',
        message: msg.text, 
        responses: responses,
        need: _.find(responses, { needLocation: true }) ? 'location' : ''
      });
      
      function normalizeResponse(r) {
        r.userId = msg.userId;



        if (_.isString(r)) r = { text: r };
        if (r.text && _.isArray(r.text)) {
          r.text = r.text.join('\n');
        }
        if (r.choices) {
          r.keyboard = r.choices;
          delete r.choices;
        }

        // console.log('r', r);

        return r;
      }

      if (!_.isArray(responses)) responses = [responses];

      let adapter = this.adapterByUserId(msg.userId);

      // console.log('sdsd', msg.text, responses);

      responses
        .map(normalizeResponse)
        .map(function(r) {
          return function() {           
            console.log('sent', _.keys(r));
            return adapter.reply(r);
          };
        })
        .reduce(Q.when, Q());


    }.bind(this));
  }

  onLocation (msg) {
    console.log('onLocation', msg);

    dialogs.insert({ 
      userId: msg.userId, 
      time: Date.now(),
      location: msg.location
    });

    

    dialogs.find({ userId: msg.userId, type: 'incoming' }).sort({ time: -1 }).limit(1).exec(function (err, docs) {
      // docs contains Earth
      // console.log('find last message', err, docs);
      if (err || !docs.length ) return;

      this.onMessage({
        userId: docs[0].userId,
        text: docs[0].message,
        reply: {
          location: msg.location
        }
      });

    }.bind(this));
  }
};
