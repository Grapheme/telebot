'use strict';
var _ = require('lodash');
var fs = require('fs');
var stream = require('stream');
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
      offtopic: [],
      query: '',
      modifiers: []
    }; 

    let greetingPattern = /(привет|добр[^ ]* [^ ]*|здорова|здрав[^ ]*|робот|эй)([\!\.\,\s]*)?/im; 
    let greeting = random ? _.sample(Phrases.greetings) : Phrases.greetings[0];
    text = text.replace(greetingPattern, function() {
      result.offtopic.push(greeting);      
      return '';
    }).trim();

    let offtopicPattern = /(как(.*)дел[^ ]*|как(.*)жизн[^ ]*|как пожива[^ ]*|что дела[^ ]*)/im;
    let offtopic = random ? _.sample(Phrases.offtopic) : Phrases.offtopic[0];
    text = text.replace(offtopicPattern, function() {
      result.offtopic.push(offtopic);      
      return '';
    }).trim();

    var queryPattern = /((найд[^ ]+|найти|искать|ищи|где|подскажи|покажи|как[^ ]+)\s+)(.*)/im;
    text = text.replace(queryPattern, function(m, m1, m2, m3) {
      // console.log('queryPattern', arguments);
      result.query = m3;      
      return '';
    }).trim();

    var bestPattern = /лучш|хорош|неплох/im;
    text = text.replace(bestPattern, function(m) {
      result.modifiers.push('best');
      return '';
    }).trim();
    
    // недалеко ближайщий рядом вокруг - запрашивать местоположение, сортировать по расстоянию

    // недорогой дешевый - сортировать по цене
    
    if (!result.modifiers.length) {
      // случайный из нескольких c высоким рейтингом
      result.modifiers.push('randomBest');
    }
    
    if (!result.query) {
      result.query = text;
    }
    
    return result;
  }

  onMessage (msg) {
    console.log('message:', msg.userId, msg.text);
    let result = this.processMessageText(msg.text, true);
    
    let searchOptions = { query: result.query };
    if (_.include(result.modifiers, 'best')) {
      searchOptions.sortBy = 'rating';
    }

    if (result.query) {
      localWay.search(searchOptions).then(function(places) {

        if (places.length) {
          let p = places[0];

          if (_.include(result.modifiers, 'randomBest')) {
            p = _(places).filter(function(p) { return p.rating > 4.6; }).sample();
          }


          console.log('place:', p._id, p.name, p.address, p.lat, p.lon);
          // console.log(p);

          let city = localWay.agglomerationReadableIdById(p.agglomeration);
          p.link = `https://localway.ru/${ city }/poi/${ p.readableId }_${ p._id.split('af')[0] }`;

          let resultText = Phrases.result(p);
          if (result.offtopic.length) {
            resultText = [].concat(result.offtopic, '\n', resultText);            
          }

          msg.reply({ text: resultText.join('\n') })
            .then(function() {
              return msg.reply({ image: localWay.image(p.cover) });
            })
            .then(function() {
              return msg.reply({ location: { lat: p.lat, lon: p.lon }});
            });
        } else {
          msg.reply({ text: [].concat(Phrases.notFound, Phrases.help).join('\n') });
        }
      });
    } else {
      result.offtopic.push(_.sample(Phrases.callsToAction));
      msg.reply({ text: result.offtopic.join('\n') });
    }
  }
};
