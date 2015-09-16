'use strict';
let Q = require('q');
let _ = require('lodash');
let LocalWayApi = require('../localway-api');
let localWay = new LocalWayApi();

let Dialog = require('./dialog');

let PlaceNotFound = require('./place-not-found');
let PlaceFound = require('./place-found');
let NeedLocation = require('./need-location');

let History = require('../history').instance;

// for (let r in Talk.querySort) {
//   let m = Talk.querySorting[r];
//   text = text.replace(new RegExp(r, 'im'), function() {
//     result.sorting.push({ type: m.type });
//     if (m.response) result.responseText.push(m.response);
//     return '';
//   }).trim();
// }


// for (let i = 0; i < response.length; i++) {
//   response[i] = response[i].replace('QUERY', message.query);
// }

// text -> 



module.exports = class PlaceSearch extends Dialog {  
  constructor() {
    super();

    this.accept = ['text', 'location'];

    this.needLocation = new NeedLocation();

    this.placeFound = new PlaceFound();
    this.placeNotFound = new PlaceNotFound();

    this.addChild(this.needLocation);
    this.addChild(this.placeFound);
    this.addChild(this.placeNotFound);

    this.querySort = {
      '(лучш|хорош|неплох)\\S*': { 
        type: 'best',
        // response: 'Посмотрите QUERY с самой высокой оценкой'
      },
      '(недорог|дешев)\\S*': {
        type: 'cheapest' //  - сортировать по цене
      }
    };

    this.querySort[this.needLocation.match[0]] = {
        type: 'closest', // сортировать по расстоянию
        need: 'location'
    };

  }

  get match() {
    return [
      '(найд|найти|искать|ищи|где|подскаж|покаж|как|место для)(\\S*)?\\s*'
    ];
  }

  response(message, meta) {
    let text = message.text;

    if (!text && message.location) {
      text = Q.Promise(function(resolve) {
          History.lastIncomingTextMessage(message.userId, function(err, docs) {
            console.log('find text', err, docs);

            if (!err && docs[0]) {
              resolve(docs[0].text);
            } else {
              resolve('');
            }
          });
      });
    }

    return Q.Promise(function(resolve, reject) {
      return Q.when(text)
        .then(this.processMessage.bind(this))
        .then(function(processed) {
            
        console.log('response processed:', processed, 'message:', message, text);

        let search = function() {

          this.searchForPlace(processed)
            .then(this.onFoundPlace.bind(this))
            .then(function(resp) {
              resolve(resp);
            })
            .fail(reject);
        }.bind(this);

        // ищем
        History.lastLocationMessage(message.userId, function(err, docs) {
          if (err || !docs.length ) {
            console.log('location not found in History');

            if (processed.need === 'location') {
              console.log('need to ask location');              
              resolve(this.needLocation.response());    
            } else {
              console.log('normal search');
              search(processed);
            }
          } else {
            console.log('normal search with location');
            processed.location = docs[0].location;
            search(processed);
          }
        }.bind(this));
      }.bind(this))
      .fail(reject);
    }.bind(this));
  }

  onFoundPlace(results) {
    let processedMessage = results[0];
    let place = results[1];

    if (!place) {
      console.log('not  fouuuund!');
      return this.placeNotFound.response();
    }

    return this.placeFound.response({}, {
      place: place,
      processedMessage: processedMessage
    });
  }

  processMessage(text) {

    let result = {
      need: '',
      query: '',
      modifiers: [],
      sorting: [],
    };  

    console.log('processMessage????', text);


    for (let r in this.querySort) {
      text = text.replace(new RegExp(r, 'im'), function() {
        let s = this.querySort[r];
        result.sorting.push(s);
        if (s.need) result.need = s.need;
        return '';
      }.bind(this)).trim();
    }

    // console.log('cate', _.pluck(localWay.categories, 'name'));

    for (let c of localWay.categories) {
      text = text.replace(new RegExp(c.name.replace('+', '\\+'), 'im'), function(m) {
        result.modifiers.push({ type: 'category', category: c }); 
        return '';
      }).trim();
    }

    // TODO получить amenityName cuisineName 
    text = text.replace(/кухн\S*/im, function() {
      result.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
      return '';
    });

    result.query = text;

    result.query = result.query.replace(new RegExp(this.match, 'im'),'').replace(/[?!.]/m,' ').replace(/\s+/m,' ').trim().toLowerCase();
    
    if (!result.query && !_.find(result.modifiers, { type: 'category' })) {
      result.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
    }

    if (!result.sorting.length) {
      result.sorting.push({ type: 'randomBest' });
    }

    return result;
  }


  searchForPlace(processedMessage) {
    var deferred = Q.defer();

    let searchOptions = { query: processedMessage.query };
    let c = _(processedMessage.modifiers).find({ type: 'category' });
    if (c) {
      searchOptions.categoryName = c.category.name;
    }



    if (processedMessage.location) {
      // console.log('search with location!!!!!!');
      searchOptions.latitude = processedMessage.location.latitude;
      searchOptions.longitude = processedMessage.location.longitude;
    }

    let requests = [];

    if (_(processedMessage.sorting).pluck('type').intersection(['randomBest']).value().length) {
      requests.push(localWay.searchRandomBest(searchOptions));
    }


    if (_(processedMessage.sorting).pluck('type').include('closest')) {
      requests.push(localWay.searchClosest(searchOptions));
    }

    if (_(processedMessage.sorting).pluck('type').include('cheapest')) {
      requests.push(localWay.searchRandomCheapest(searchOptions));
    }
    
    if (_.compact(processedMessage.query.split(/\s+/)).length > 1) {
      requests.push(localWay.search(searchOptions));
    }



    Q.all(requests).then(function(searchResults) {    
      let normal = searchResults[0];
      let exact = searchResults[1] || [];
      
      if (!normal.length && !exact.length) {
        deferred.resolve([processedMessage]);
      } else {
        let place = normal[0];

        if (exact.length) {
          let match = localWay.matchPlaces(exact, processedMessage.query);
          if (match) { 
            place = match;
          }
        }
        
        console.log('first result "normal"', normal[0].name);

        console.log('place:', place._id, place.name);
        // console.log('place:', place._id, place.name, place.aliases, place.address, place.lat, place.lon);
        place = localWay.preparePlace(place); 

        deferred.resolve([processedMessage, place]);  
      }
    });

    return deferred.promise;
  }
};
