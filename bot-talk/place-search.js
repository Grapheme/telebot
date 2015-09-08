'use strict';
let Q = require('q');
let _ = require('lodash');
let LocalWayApi = require('../localway-api');
let localWay = new LocalWayApi();

let Talk = require('../bot-talk');

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

module.exports = {
  default: true,
  priority: 1,

  accept: ['text', 'location'],
  
  match: [
    '(найд|найти|искать|ищи|где|подскаж|покаж|как)\\S*\\s*'
  ],

  querySort: {
    '(лучш|хорош|неплох)\\S*': { 
      type: 'best',
      response: 'Посмотрите QUERY с самой высокой оценкой'
    },
    '(недалек|ближай|рядом|вокруг|поблизост)\\S*': {
      type: 'closest', // сортировать по расстоянию
      need: 'location'
    },
    '(недорог|дешев)\\S*': {
      type: 'cheapest' //  - сортировать по цене
    }
  },

  notFound: [
    'Не нашел ничего 😪'
  ],

  placeText: function(place) {
    let text = [];
    // text.push('Я нашел для вас это место:');
    text.push(`${ place.mainCategoryName } "${ place.name }"`);
    text.push(place.address);
    text.push(place.link);
    // text.push(place.image);
    return text;
  },

  locationText: 'Поделись своим местоположением',

  response: function(message, matched, history) {
    let processed = this.processMessage(message, history);


    return Q.Promise(function(resolve, reject) {

      let search = function(processed) {
        this.searchForPlace(processed)
          .then(this.onFoundPlace.bind(this))
          .then(function(resp) {
            resolve(resp);
          });
      }.bind(this);


      console.log('sdsd', processed, message);

      if (processed.need) {


        if (message.reply) {
          if (processed.need === 'location' && message.reply.location) {
            // use this
            processed.location = message.reply.location;
            search(processed);
          } else {
            reject();
          }
        } else {


          console.log('find in history');


          history.find({ userId: message.userId, type: 'incoming', time: { $gt: Date.now() - 30 * 60 * 1000 }, location: { $exists: true } }).sort({ location: -1 }).limit(1).exec(function(err, docs) {
            if (err || !docs.length ) {

              console.log('not found in history');

              resolve([{ text: this.locationText, need: 'location' }]);
            } else {
              console.log('found in history', docs[0]);
              
              processed.location = docs[0].location;
              search(processed);
            }
          }.bind(this));
        }
      } else {
        search(processed);
      }
    }.bind(this));

    

        
    //   } else {
    //     this.searchForPlace(processed)
    //       .then(this.onFoundPlace.bind(this))
    //       .then(function(resp) {
    //         resolve(resp);
    //       });
    //   }
    // }.bind(this));
    
  },

  onFoundPlace: function(place) {
    if (place) {
      // return [{ image: place.coverImage() }, { text: this.placeText(place) }];
      return [{ text: this.placeText(place) }, { image: place.coverImage() }];
    }
    return [this.notFound, Talk.help];
  },

  processMessage: function(message) {
    let text = message.text;

    let result = {
      need: '',
      query: '',
      modifiers: [],
      sorting: [],
    };  

    console.log('sdsd processed', message);


    for (let r in this.querySort) {
      text = text.replace(new RegExp(r, 'im'), function() {
        let s = this.querySort[r];
        result.sorting.push(s);
        if (s.need) result.need = s.need;
        return '';
      }.bind(this)).trim();
    }

    for (let c of localWay.categories) {
      text = text.replace(new RegExp(c.name.replace('+', '\\+'), 'im'), function(m) {
        result.modifiers.push({ type: 'category', category: c }); 
        return '';
      }).trim();
    }

    result.query = text;

    result.query = result.query.replace(/[?!.]/m,' ').replace(/\s+/m,' ').trim().toLowerCase();
    
    // TODO получить amenityName cuisineName 
    result.query = result.query.replace(/кухн\S*/im, function() {
      result.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
      return '';
    });

    if (!result.sorting.length) {
      result.sorting.push({ type: 'randomBest' });
    }

    return result;
  },


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

    if (_(processedMessage.sorting).pluck('type').intersection(['best', 'randomBest']).value().length) {
      requests.push(localWay.searchRandomBest(searchOptions));
    }


    if (_(processedMessage.sorting).pluck('type').include('closest')) {
      requests.push(localWay.searchRandomClosest(searchOptions));
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
        deferred.resolve();
      } else {
        let place = normal[0];

        if (exact.length) {
          let match = localWay.matchPlaces(exact, processedMessage.query);
          if (match) { 
            place = match;
          } 
        }

        console.log('place:', place._id, place.name, place.aliases, place.address, place.lat, place.lon);
        place = localWay.preparePlace(place); 

        deferred.resolve(place);  
      } 
    });

    return deferred.promise;
  }
};
