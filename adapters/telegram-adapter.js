'use strict';
var fs = require('fs');
var TelegramBotApi = require('node-telegram-bot-api');
var _ = require('lodash');
var request = require('request');
var Q = require('q');

module.exports = class TelegramAdatper {
  constructor(tokenFile) {
    this.token = fs.readFileSync(tokenFile, 'utf8').trim();
    this.callbacks = {};
  }

  // будет выполняться в контексте сообщения 
  // TODO: добавить в _reply поддержку очереди -- сообщения должны отправляться в порядке вызова
  _reply(data) {
    let id = this.userId.replace('telegram:','');

    if (data.text) {
      let options = {};
      if (data.keyboard) {
        options.reply_markup = JSON.stringify({
          one_time_keyboard: true,
          keyboard: _.map(data.keyboard, function(i) {
            return [i];
          })
        });
      }
      
      return this.adapter.sendMessage(id, data.text, options);
    }

    if (data.location) {
      return this.adapter.sendLocation(id, data.location);
    }

    if (data.image) {
      return this.adapter.sendPhoto(id, data.image);
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
            adapter: this,
            reply: this._reply
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
    return this.api.sendMessage(chatId, text,  _.extend({ disable_web_page_preview: true }, options || {}));
  }

  sendLocation(chatId, location) {
    return this.api.sendLocation(chatId, location.lat, location.lon);
  }

  // sendPhoto (chatId, photo) {
  //   return this.api.sendMessage(chatId, photo);
  // }

  sendPhoto(chatId, photo) {
    let deferred = Q.defer();
    request.post({ url: `https://api.telegram.org/bot${ this.token }/${ 'sendPhoto' }`, formData: {
      chat_id: chatId,
      photo: photo
    }}, function(err, response, body) {
      if (!err) {
        deferred.resolve(body);
      }
    });
    return deferred.promise;
  }
};

