'use strict';
let _ = require('lodash');
// let async = require('async');
let Q = require('q');
let requireDir = require('require-dir');

let Dialog = require('./dialogs/dialog');
let RootDialog = require('./dialogs/root-dialog');
let SimpleDialog = require('./dialogs/simple');

let History = require('./history').instance;
var util = require('util');

module.exports = class Bot {
  constructor(options) {
    this.adapters = [];
    this.rootDialog = new RootDialog();
    this.simpleDialog = new SimpleDialog();

    this.rootDialog.printTree();

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

    console.log('\nlastDialog:', lastDialog.getPath());
    console.log('children: ');
    lastDialog.getChildren().map(function(c) { return console.log('  ',c.getPath()); });
    console.log('default:', lastDialog.defaultSubdialog ? lastDialog.defaultSubdialog.getPath() : '');
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

      if (msg.location && _.include(d.accept, 'location')) {
         return true;
      }

      return false;
    }.bind(this));


    // бесполезный разговор который не меняет текущий диалог
    if (!dialog) {
      let s = this.simpleDialog.response(msg);
      if (s) {
        return Q.when({ lastDialogPath: lastDialog.getPath(), responses: s.responses });
      }
    }

    if (!dialog) {
      dialog = lastDialog.defaultSubdialog;
    }


    if (!dialog) {
      console.log('unkonwn command:', msg.text);
      return Q.when({ 
        dialog: lastDialog, 
        responses: [
          { text: [lastDialog.unknown || Dialog.unknown, lastDialog.help || Dialog.help].join('\n') }
        ]
      });
    }

    return Q.when(dialog.response(msg, { matched: matched }));
  }

  onMessage (msg) {
    console.log('\non message', msg);

    History.insert({ 
      time: Date.now(), 
      userId: msg.userId,
      text: msg.text,
      location: msg.location,
      type: 'incoming'
    }, function(err) {
      if (err) console.log('History insert err', err);
    });

    setTimeout(function() {
      return;

      History.db.find({}).sort({ time: -1 }).exec(function(err, docs) {
        console.log('\n\n\n on message History');
        _.each(docs, function(msg) { 
          console.log(util.inspect(msg, {showHidden: false, depth: 5 }), '\n'); 
        });
        console.log('\n\n\n');
      });
    }, 4 * 1000);


    History.lastOutgoingMessage(msg.userId)
      .then(function (message) {
        let lastDialog = message && message.dialog && this.rootDialog.find(message.dialog);
        if (!lastDialog) lastDialog = this.rootDialog;
        if (!lastDialog.getChildren().length) lastDialog = this.rootDialog;
        if (message && Date.now() - message.time > 5 * 60 * 1000) lastDialog = this.rootDialog;
        return lastDialog;
      }.bind(this))
      .then(_.bind(this.processMessage, this, msg))
      .then(function (result)  {
        let simpleResults = _.map(result.responses, function(r) { 
          // console.log('rr', r.image);
          return { 
            text: r.text, 
            image: r.image,
            location: r.location
          };
        });

        console.log('responses from');
        console.log('- dialog:', (result.dialog ? result.dialog.getPath() : ''));
        console.log('- responses:', simpleResults);
        console.log('\n');
        

        History.insert({
          time: Date.now(), 
          userId: msg.userId, 
          type: 'outgoing',
          meta: result.meta,
          responses: simpleResults,
          dialog: (result.dialog ? result.dialog.getPath() : '')
        }, function(err) {
          if (err) console.log('History insert err', err);
        });

        return result;
      })
      .then(function(result) {
        let lastResponse = _.last(result.responses);

        if (result.dialog && !lastResponse.choices) {
          lastResponse.choices = _.chain(result.dialog.getChildren()).pluck('label').compact().value();
        }
        // console.log('choices????', result.responses);
        return result.responses;
      })
      .then(_.bind(this.sendResponses, this, msg.userId))
      .fail(function(err) {
        if (err) console.log('Error processing message', err, err.stack);
      });
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
