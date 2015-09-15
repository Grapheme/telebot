'use strict';
var TelegramBotApi = require('node-telegram-bot-api');
var _ = require('lodash');
var request = require('request');
// request.debug = true;
var Q = require('q');

module.exports = class TelegramAdatper {
  constructor(token) {
    this.type = 'telegram';

    this.token = token;
    this.callbacks = {};
  }
  
  start() {
    this.api = new TelegramBotApi(this.token, {polling: true});
    
    for (let e in this.callbacks) {
      for (let c of this.callbacks[e]) {
        this.api.on(e, function(msg) {
          //все адаптеры отдают нормализованный объект сообщения
        c({
          userId: this.type + ':' + msg.chat.id,
          text: msg.text || '',
          location: msg.location
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

  send(msg) {
    let id = msg.userId.replace(this.type + ':','');

    if (msg.text) {
      let options = {};
      if (msg.keyboard) {
        options.reply_markup = JSON.stringify({
          // hide_keyboard: true,
          resize_keyboard: true,
          one_time_keyboard: true,
          keyboard: _.map(msg.keyboard, function(i) {
            return _(i).isArray() ? i : [i];
          })
        });
      } else {
        options.reply_markup = JSON.stringify({
          hide_keyboard: true
        });
      }
      
      return this.sendMessage(id, msg.text, options);
    }

    if (msg.location) {
      return this.sendLocation(id, msg.location);
    }

    if (msg.image) {
      // if (_(msg.image).isString()) {
        // return this.sendPhotoByUrl(msg.image);
      // }
      return this.sendPhoto(id, msg.image);
    }
  }

  sendMessage(chatId, text, options) {
    let data = _.extend({ 
      disable_web_page_preview: true 
    }, options || {});

    // console.log('sendMessage', data);
    return Q(this.api.sendMessage(chatId, text, data));
  }

  sendLocation(chatId, location) {
    return this.api.sendLocation(chatId, location.lat, location.lon);
  }

  sendPhoto (chatId, photo) {
    return this.api.sendPhoto(chatId, photo);
  }
};

