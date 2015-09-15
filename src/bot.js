'use strict';
let _ = require('lodash');
// let async = require('async');
let Q = require('q');
let requireDir = require('require-dir');

let Dialog = require('./dialogs/dialog');
let rootDialog = require('./dialogs/root-dialog').instance;
let simple = require('./dialogs/simple').instance;

let Datastore = require('nedb');
let history = new Datastore(); //{ filename: 'path/to/datafile', autoload: true }

history.lastOutgoingMessage = function(userId, func) {
  return this.find({ userId: userId, type: 'outgoing' }).sort({ time: -1 }).limit(1).exec(func);
};

// location last 30 min
history.lastLocationMessage = function(userId, func) {
  return this.find({ userId: userId, type: 'incoming', time: { $gt: Date.now() - 30 * 60 * 1000 }, location: { $exists: true } }).sort({ time: -1 }).limit(1).exec(func);
};

// place last 5 min 
history.lastPlaceMessage = function(userId, func) {
  return this.find({ userId: userId, type: 'outgoing', time: { $gt: Date.now() - 5 * 60 * 1000 }, meta: {  place: { $exists: true } } }).sort({ time: -1 }).limit(1).exec(func);
};

module.exports = class Bot {
  constructor(options) {
    this.adapters = [];
    this.rootDialog = rootDialog;

    let adapters = requireDir('./adapters');

    for (let adapterName in options.adapters) {
      let Adapter = adapters[adapterName + '-adapter'];
      if (Adapter) {
        this.addAdapter(new Adapter(options.adapters[adapterName]));
      }
    }
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

  processMessage (msg, lastDialog) {
    let matched;

    console.log('\ndialogs for response:');
    console.log(lastDialog.getPath());
    lastDialog.getChildren().map(function(c) { return console.log(c.getPath(), c.match.join(',')); });
    console.log(lastDialog.defaultSubdialog ? lastDialog.defaultSubdialog.getPath() : '');
    console.log('\n');

    let dialog = _.find(lastDialog.getChildren(), function(d) { 
      if (msg.text && d.match && d.match.length) {
        for (let r of d.match) {  
          let m = msg.text.match(new RegExp(r, 'im'));
          if (m) {
            matched = r;
            return true;
          } 
        }
      }


      // if (msg.location && _.include(d.accept, 'location')) {
      //    return true;
      // }

      return false;
    }.bind(this));

    // бесполезный разговор который не меняет текущий диалог
    if (!dialog) {
      let s = simple.response(msg);
      if (s) {
        return Q.when({ lastDialogPath: lastDialog.getPath(), responses: s.responses });
      }
    }

    if (!dialog) {
      dialog = lastDialog.defaultSubdialog;
    }


    if (!dialog) {
      console.log('unkonwn phrase:', msg.text);
      return Q.when({ dialog: null, responses: [lastDialog.unkonwnPhrase || Dialog.unkonwnPhrase, lastDialog.help || Dialog.help].join('\n') });
    }

    return Q.when(dialog.response(msg, history, matched));
  }

  onMessage (msg) {
    console.log('\non message', msg);

    history.insert({ 
      time: Date.now(), 
      userId: msg.userId,
      text: msg.text,
      location: msg.location,
      type: 'incoming'
    }, function(err) {
      if (err) console.log('history insert err', err);
    });

    setTimeout(function() {
      history.find({}).sort({ time: -1 }).exec(function(err, docs) {
        let r = _.map(docs, function(msg) { 
          return msg.text ? `> time: ${ msg.time }, text: ${ msg.text }` : `< time: ${msg.time  } dialog: ${ msg.dialog }`; 
        });

        console.log('\n\n\n on message history', r);    
        console.log('\n\n\n');
      });
    }, 4 * 1000);


    history.lastOutgoingMessage(msg.userId, function(err, messages) {
      let lastDialog;

      if (err || !messages.length || !messages[0].dialog || Date.now() - messages[0].time > 5 * 60 * 1000) {

        lastDialog = this.rootDialog;
      } else {
        lastDialog = this.rootDialog.find(messages[0].dialog);
      } 

      // console.log('on Message', lastDialog.getPath());

      let sendResponses = _.bind(this.sendResponses, this, msg.userId);

      this.processMessage(msg, lastDialog)
        .then(function (result)  {
          

          let simpleResults = _.map(result.responses, function(r) { 
            // console.log('rr', r.image);

            return { 
              meta: r.meta || {},
              text: r.text, 
              image: Boolean(r.image)
            }; 
          });

          console.log('processMessage responses', simpleResults);

          

          history.insert({
            time: Date.now(), 
            userId: msg.userId, 
            type: 'outgoing',
            responses: simpleResults,
            dialog: (result.dialog ? result.dialog.getPath() : '')
          }, function(err) {
            if (err) console.log('history insert err', err);
          });

          return result;
        })
        .then(function(result) {
          if (result.dialog && !result.responses[0].choices) {
            result.responses[0].choices = _.chain(result.dialog.getChildren()).pluck('label').compact().value();
          }
          // console.log('choices????', result.responses[0].choices);
          return result.responses;
        })
        .then(sendResponses)
        .fail(function(err) {
          if (err) console.log('Error processing message', err, err.stack);
        });
        
    }.bind(this));
  }

  sendResponses(userId, responses) {
    if (!_.isArray(responses)) {
      responses = [responses];
    }

    let adapter = this.adapterByUserId(userId);

    

    responses
      .map(this.normalizeResponse)
      .map(function(r) {
        r.userId = userId;

        return function() {           
          // console.log('sending', r);
          return adapter
            .send(r)
            .fail(function(err) {
              console.log('error sending', err);
            })
            .then(function() {
                return Q.Promise(function(resolve) {
                  setTimeout(resolve, 1 * 1000);
                });
            });
        };
      })
      // oh sequential promises 
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

    if (r.image) {
      normalized.image = r.image;
    }

    if (_.isString(r)) {
      normalized.text =  r;
    }
    if (_(normalized.text).isArray()) {
      normalized.text = normalized.text.join('\n');
    }
    if (r.choices && r.choices.length) {
      normalized.keyboard = r.choices;
      delete r.choices;
    }

    return normalized;
  }
};
