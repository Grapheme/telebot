'use strict';
var TelegramBotApi = require('node-telegram-bot-api');
var _ = require('lodash');
var request = require('request');
var Q = require('q');

module.exports = class TelegramAdatper {
  constructor(token) {
    this.type = 'telegram';

    this.token = token;
    this.callbacks = {};
  }

  
  reply(msg) {
    let id = msg.userId.replace('telegram:','');

    if (msg.text) {
      let options = {};
      if (msg.keyboard) {
        options.reply_markup = JSON.stringify({
          one_time_keyboard: true,
          keyboard: _.map(msg.keyboard, function(i) {
            return [i];
          })
        });
      }
      
      return this.sendMessage(id, msg.text, options);
    }

    if (msg.location) {
      return this.sendLocation(id, msg.location);
    }

    if (msg.image) {
      return this.sendPhoto(id, msg.image);
    }
  }

  start() {
    this.api = new TelegramBotApi(this.token, {polling: true});
    
    for (let e in this.callbacks) {
      for (let c of this.callbacks[e]) {
        this.api.on(e, function(msg) {
          //все адаптеры отдают нормализованный объект сообщения
        c({
          userId: 'telegram:' + msg.chat.id,
          text: msg.text,
          location: msg.location
          // adapter: this,
          // reply: this._reply
        });
        }.bind(this));
      }
    }
  }

  // messageType - text, location
  on(messageType, callback) { 
    if (!this.callbacks[messageType]) {
      this.callbacks[messageType] = []; 
    }
    this.callbacks[messageType].push(callback);
  }

  sendMessage(chatId, text, options) {
    options = _.extend({ disable_web_page_preview: true }, options || {});

    console.log('sendMessage', chatId, text, options);

    // return Q.Promise(function(resolve) {
    //   this.api.sendMessage(chatId, text, options)
    //     .then(function() {
    //       setTimeout(function() {
    //         resolve()
    //       }, 10)
    //       console.log('succes');
    //     }, function() {
    //       console.log('error!!!!', arguments);
    //     });
    // })

    return  this.api.sendMessage(chatId, text, options)
      .then(function() {
        console.log('sending succes');
      }, function() {
        console.log('sending error!!!!', arguments);
      });
  }

  sendLocation(chatId, location) {
    return this.api.sendLocation(chatId, location.lat, location.lon);
  }

  // sendPhoto (chatId, photo) {
  //   return this.api.sendMessage(chatId, photo);
  // }

  sendPhoto(chatId, photo) {
    // console.log('sendPhoto', chatId, photo);

    let deferred = Q.defer();
    request.post({ url: `https://api.telegram.org/bot${ this.token }/${ 'sendPhoto' }`, formData: {
      chat_id: chatId,
      photo: photo
    }}, function(err, response, body) {
      console.log('senfing Photo', err);

      if (!err) {
        deferred.resolve(body);
      }
    });
    return deferred.promise;
  }
};

