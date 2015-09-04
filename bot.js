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

  start() {
    for (let a of this.adapters) {
      a.on('text', function() {
        try {
          this.onMessage.apply(this, arguments);
        } catch(e) {
          console.log('Error onMessage', e.stack);
        }

      }.bind(this));
      
      // a.on('location', this.onLocation.bind(this));
      a.start();
      console.log('Bot started...');
    }
  }

  processMessageText (text) {
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
    привет хуй - (меня)?\s+?(зовут)?([^\.\,]+)

    
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

    Q.when(dialog.response(message, matched)).then(function(responses) {
      deferred.resolve(responses);
    });
    
    return deferred.promise;



    // for (let r in Talk.greetings) {
    //   let responses = Talk.greetings[r];
    //   text = text.replace(new RegExp(r, 'im'), function() {
    //     let response = random ? _.sample(responses) : responses[0];
    //     result.responseText.push(response);
    //     return '';
    //   }).trim();
    // }

    // for (let r in Talk.offtopic) {
    //   let responses = Talk.offtopic[r];
    //   text = text.replace(new RegExp(r, 'im'), function() {
    //     let response = random ? _.sample(responses) : responses[0];
    //     result.responseText.push(response);
    //     return '';
    //   }).trim();
    // }

    // for (let r in Talk.querySort) {
    //   let m = Talk.querySorting[r];
    //   text = text.replace(new RegExp(r, 'im'), function() {
    //     result.sorting.push({ type: m.type });
    //     if (m.response) result.responseText.push(m.response);
    //     return '';
    //   }).trim();
    // }

    
    // for (let c of localWay.categories) {
    //   text = text.replace(new RegExp(c.name.replace('+', '\\+'), 'im'), function(m) {
    //     result.modifiers.push({ type: 'category', category: c }); 
    //     // return m;
    //     return '';
    //   }).trim();
    // }

    // for (let r in Talk.dialogs) {
    //   if (result.query.match(new RegExp(r, 'im'))) {
    //     let response = Talk.dialogs[r].response;
    //     result.responseText.push(_.isArray(response) ? _.sample(response) : response);
    //     result.choices = Talk.dialogs[r].choices;
    //   }
    // } 
  
    // for (let i = 0; i < response.length; i++) {
    //   response[i] = response[i].replace('QUERY', message.query);
    // }
  
  }



  onMessage (msg) {

    this.processMessageText(msg.text).then(function(responses) {
      dialogs.insert({ 
        userId: msg.userId, 
        message: msg.text, 
        responses: responses
      }, function (err, newDoc) {

      });

      // console.log(msg.text, responses);

      if (!_.isArray(responses)) responses = [responses];
      _(responses).map(function(r) {
        return function() { 
          if (_.isString(r)) r = { text: r };
          if (!_.isArray(r.text)) r.text = [r.text];
          return msg.reply({ text: r.text.join('\n'), keyboard: r.choices  });  
        };
      }).reduce(Q.when, Q());
    });


    //   if (processedMessage.query || _(processedMessage.modifiers).pluck('type').include('category')) {

    //     this.searchForPlace(processedMessage).then(function(place) {
    //       if (place) {
    //         response.text = response.text.concat(Talk.place(place));
    //       } else {
    //         response.text = response.text.concat(Talk.notFound, Talk.help); 
    //       }

    //       msg.reply({ text: response.text.join('\n') })
    //         .then(function() {
    //           if (!place) {
    //             return;
    //           }
    //           return msg.reply({ image: place.coverImage() }).then(function() {
    //             // return msg.reply({ location: { lat: place.lat, lon: place.lon }});
    //           });
    //         });
    //     });

    //   } else if (response.text.length) {
    //     msg.reply({ text: response.text.join('\n') });
    //   }

    // }); 
  }
};
