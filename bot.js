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
      modifiers: [],
      sorting: []
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

    for (let r in Phrases.querySort) {
      let m = Phrases.querySorting[r];
      text = text.replace(new RegExp(r, 'im'), function() {
        result.sorting.push({ type: m.type });
        if (m.response) result.text.push(m.response);
        return '';
      }).trim();
    }

    if (!result.sorting.length) {
      // случайный из нескольких c высоким рейтингом
      result.sorting.push({ type: 'randomBest' });
    }

    // for (let s of localWay.sections) {
    //   text = text.replace(new RegExp(s.name.replace('+', '\\+'), 'im'), function() {
    //     result.modifiers.push({ section: s }); 
    //     return '';
    //   }).trim();
    // }

    for (let c of localWay.categories) {
      text = text.replace(new RegExp(c.name.replace('+', '\\+'), 'im'), function(m) {
        result.modifiers.push({ type: 'category', category: c }); 
        // return m;
        return '';
      }).trim();
    }

    // console.log('before query', text);
    text = text.replace(new RegExp(Phrases.query, 'im'), function(m, m1, m2) {
      // console.log('queryPattern', arguments);
      result.query = m2;      
      return '';
    }).trim();
    

    if (!result.query) {
      result.query = text;
    }


    
    result.query = result.query.replace(/[?!.]/m,' ').replace(/\s+/m,' ').trim().toLowerCase();

    for (let r in Phrases.dialogs) {
      if (result.query.match(new RegExp(r, 'im'))) {
        let response = Phrases.dialogs[r].response;
        result.text.push(_.isArray(response) ? _.sample(response) : response);
        result.choices = Phrases.dialogs[r].choices;
      }
    } 

    for (let i = 0; i < result.text.length; i++) {
      result.text[i] = result.text[i].replace('QUERY', result.query);
    }

    // TODO получить amenityName cuisineName 
    result.query = result.query.replace(/кухн\S*/im, function() {
      result.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
      return '';
    });

    
    return result;
  }

  onMessage (msg) {
    console.log('message:', msg.userId, msg.text);
    let result = this.processMessageText(msg.text, true);
    // console.log('processed message', result);

    if (result.choices) {
      msg.reply({ text: result.text.join('\n'), keyboard: result.choices });
    } else if (result.query || _(result.modifiers).pluck('type').include('category')) {

      let searchOptions = { query: result.query };
      let c = _(result.modifiers).find({ type: 'category' });
      if (c) searchOptions.categoryName = c.category.name;

      let requests = [];

      if (_(result.sorting).pluck('type').intersection(['best', 'randomBest']).value().length) {
        requests.push(localWay.searchRandomBest(searchOptions));
      }
      
      if (_.compact(result.query.split(/\s+/)).length > 1) {
        requests.push(localWay.search(searchOptions));
      }


      Q.all(requests).then(function(searchResults) {    
        let normal = searchResults[0];
        let exact = searchResults[1] || [];
        

        if (!normal.length && !exact.length) {
          msg.reply({ text: [].concat(result.text, Phrases.notFound, Phrases.help).join('\n') });
        } else {
          let p = normal[0];

          let match;
          if (exact.length) {
            // console.log('find exact');
            match = localWay.matchPlaces(exact, result.query);
          }

          if (match) { 
            p = match;
          } 

          console.log('place:', p._id, p.name, p.aliases, p.address, p.lat, p.lon);
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
        } 
      });
    } else {
      result.text.push(_.sample(Phrases.callsToAction));
      msg.reply({ text: result.text.join('\n') });
    }
  }
};
