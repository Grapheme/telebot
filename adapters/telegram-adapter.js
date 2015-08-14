'use strict';
var fs = require('fs');
var TelegramBotApi = require('node-telegram-bot-api');

var request = require('request-promise');

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
      return this.adapter.sendMessage(id, data.text);
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

  sendMessage(chatId, text) {
    return this.api.sendMessage(chatId, text, { disable_web_page_preview: true });
  }

  sendLocation(chatId, location) {
    return this.api.sendLocation(chatId, location.lat, location.lon);
  }

  // sendPhoto (chatId, photo) {
  //   return this.api.sendMessage(chatId, photo);
  // }

  sendPhoto(chatId, photo) {
    return request.post({ url: `https://api.telegram.org/bot${ this.token }/${ 'sendPhoto' }`, formData: {
      chat_id: chatId,
      photo: photo
    }});
  }
};

