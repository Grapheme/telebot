'use strict';
var _ = require('lodash');
// var fs = require('fs');
// var stream = require('stream');
var LocalWayApi = require('./localway-api');
var localWay = new LocalWayApi();

var Phrases = require('./bot-phrases');
// var Datastore = require('nedb');
// var users = new Datastore();
// var dialogs = new Datastore();

module.exports = class Bot {
  constructor() {
    this.adapters = [];
  }

  addAdapter(a) {
    this.adapters.push(a);
  }

  start() {
    for (let a of this.adapters) {
      a.on('text', this.onMessage.bind(this));
      // a.on('location', this.onLocation.bind(this));
      a.start();
      console.log('Bot started...');
    }
  }

  processMessageText (text, random) {
    var result = {
      text: [],
      query: '',
      modifiers: []
    }; 

    for (let r in Phrases.greetings) {
      let responses = Phrases.greetings[r];
      text = text.replace(new RegExp(r, 'im'), function() {
        let response = random ? _.sample(responses) : responses[0];
        result.text.push(response);
        return '';
      }).trim();
    }

    for (let r in Phrases.offtopic) {
      let responses = Phrases.offtopic[r];
      text = text.replace(new RegExp(r, 'im'), function() {
        let response = random ? _.sample(responses) : responses[0];
        result.text.push(response);
        return '';
      }).trim();
    }

    for (let r in Phrases.queryModifier) {
      let m = Phrases.queryModifier[r];
      text = text.replace(new RegExp(r, 'im'), function() {
        result.modifiers.push(m.type);
        if (m.response) result.text.push(m.response);
        return '';
      }).trim();
    }

    // console.log('before query', text);
    text = text.replace(new RegExp(Phrases.query, 'im'), function(m, m1, m2) {
      // console.log('queryPattern', arguments);
      result.query = m2;      
      return '';
    }).trim();
    

    if (!result.modifiers.length) {
      // случайный из нескольких c высоким рейтингом
      result.modifiers.push('randomBest');
    }
    
    if (!result.query) {
      result.query = text;
    }


    for (let r in Phrases.dialogs) {
      if (result.query.match(new RegExp(r, 'im'))) {
        let response = Phrases.dialogs[r].response;
        result.text.push(_.isArray(response) ? _.sample(response) : response);
        result.choices = Phrases.dialogs[r].choices;
      }
    }

    for (var i = 0; i < result.text.length; i++) {
      result.text[i] = result.text[i].replace('QUERY', result.query);
    }
    
    return result;
  }

  onMessage (msg) {
    console.log('message:', msg.userId, msg.text);
    let result = this.processMessageText(msg.text, true);
    console.log('processed message', result);

    let searchOptions = { query: result.query };
    if (_.include(result.modifiers, 'best') || _.include(result.modifiers, 'randomBest') ) {
      searchOptions.sortBy = 'rating';
    }

    if (result.choices) {
      msg.reply({ text: result.text.join('\n'), keyboard: result.choices });
    } else if (result.query) {
      localWay.search(searchOptions).then(function(places) {
        if (places.length) {
          let p = places[0];
          let exactMatch = localWay.matchPlaces(places, result.query);
          if (exactMatch) {
            p = exactMatch;
          } else if (_.include(result.modifiers, 'randomBest')) {
            // p = _(places).filter(function(p) { return p.rating > 4.6; }).sample();
            p = _(places).slice(0,10).sample();
          }

          // console.log('place:', p._id, p.name, p.address, p.lat, p.lon);
          // console.log(p);

          let poiId = p._id.split('af')[0];
          let city = localWay.agglomerationReadableIdById(p.agglomeration);
          p.link = `https://localway.ru/${ city }/poi/${ p.readableId }_${ poiId }`;

          if (_.include(result.modifiers, 'best')) {
            result.text.concat();
          }

          result.text = result.text.concat(Phrases.place(p));
        
          msg.reply({ text: result.text.join('\n') })
            .then(function() {
              return msg.reply({ image: localWay.image(poiId, p.cover) }).then(function() {
                // return msg.reply({ location: { lat: p.lat, lon: p.lon }});
              });
            });
        } else {
          msg.reply({ text: [].concat(result.text, Phrases.notFound, Phrases.help).join('\n') });
        }
      });
    } else {
      result.text.push(_.sample(Phrases.callsToAction));
      msg.reply({ text: result.text.join('\n') });
    }
  }
};
