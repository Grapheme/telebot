'use strict';
var _ = require('lodash');
var async = require('async');
var Q = require('q');
var Talk = require('./bot-talk');
var Datastore = require('nedb');
var history = new Datastore(); //{ filename: 'path/to/datafile', autoload: true }

history.lastMessagesById = function(userId) {
  return this.find({ userId: userId }).sort({ time: -1 }).limit(2);
};

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
      let listener = function() {
        try {
          this.onMessage.apply(this, arguments);
        } catch(e) {
          console.log('onMessage error:', e, e.stack);
        }
      }.bind(this);

      a.on('text', listener);
      a.on('location', listener);
      a.start();
      console.log('Bot started...');
    }
  }

  processMessageText (msg) {
    let matched;
    let dialog = _.find(Talk.dialogs, function(dialog) { 
      if (!_.isArray(dialog.match)) dialog.match = [dialog.match];
      if (msg.text && _.include(dialog.accept, 'text')) {
        for (let r of dialog.match) {  
          let m = msg.text.match(new RegExp(r, 'im'));
          if (m) {
            matched = r;
            return true;
          } 
        }
      }

      if (msg.location)

      return false;
    }.bind(this));

    if (!dialog) {
      dialog = Talk.defaultDialog;
    }

    if (!dialog) {
      console.log('unkonwn phrase:', msg.text);
      return Q.when({ text: [Talk.unkonwnPhrase, Talk.help] });
    }

    return Q.when(dialog.response(msg, matched, history));
  }

  onMessage (msg) {
    console.log('on message', msg);

    history.insert({ 
      time: Date.now(), 
      userId: msg.userId,
      text: msg.text,
      location: msg.location,
      type: 'incoming'
    });

    history.lastMessagesById(msg.userId).exec(function(err, messages) {
      let lastUserMessage;
      if (!err && messages.length === 2 && messages[0].needUserReply) {
        // lastUserMessage = messages[1];
        // lastUserMessage.reply = msg;
        // console.log('q', messages[0]);
      }

      let sendResponses = _.bind(this.sendResponses, this, msg.userId);

      if (lastUserMessage && lastUserMessage.needUserReply) {
        this.processMessageText(lastUserMessage)
          .then(sendResponses, function() {
            this.processMessageText(msg)
              .then(sendResponses);
          }.bind(this));
      } else {
        this.processMessageText(msg)
          .then(sendResponses);
      }
    }.bind(this));
  }

  sendResponses(userId, responses) {
    if (!_.isArray(responses)) {
      responses = [responses];
    }

    history.insert({
      time: Date.now(), 
      userId: userId, 
      type: 'outgoing',
      responses: responses,
      needUserReply: Boolean(_.find(responses, 'need'))
    });

    let adapter = this.adapterByUserId(userId);

    // console.log('sdsd responses', responses);

    responses
      .map(this.normalizeResponse)
      .map(function(r) {
        r.userId = userId;

        return function() {           
          console.log('sent', r);
          return adapter.send(r);
        };
      })
      .reduce(Q.when, Q());
  }

  normalizeResponse (r) {
    let normalized = {};
    if (r.text) {
      normalized.text = r.text;
    }
    if (r.location) {
      normalized.location = r.location;
    }

    if (_.isString(r)) {
      normalized.text =  r;
    }
    if (_(normalized.text).isArray()) {
      normalized.text = normalized.text.join('\n');
    }
    if (r.choices) {
      normalized.keyboard = r.choices;
      delete r.choices;
    }

    return normalized;
  }
};
