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

    


module.exports = {
  default: true,
  priority: 1,
  match: [
    '(найд|найти|искать|ищи|где|подскаж|покаж|как)\\S*\\s*'
  ],

  // queryModifier: {
  //   '(лучш|хорош|неплох)\\S*': { 
  //     type: 'best',
  //     response: 'Посмотрите QUERY с самой высокой оценкой'
  //   },
  //   : {
  //     type: 'near', // запрашивать местоположение, сортировать по расстоянию
  //   },
  //   '(недорог|дешев)\\S*': {
  //     type: 'cheap' //  - сортировать по цене
  //   }
  // },


  needLocation: {
    // match: '(недалек|ближай|рядом|вокруг|поблизост)\\S*'
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

  response: function(message, matched, reply, history) {

    let processed = this.processMessage(message, reply, history);

    return Q.Promise(function(resolve) {
      if (processed.needLocation) {
        console.log('sss', history);
        
        history.sort({ location: -1 }).limit(1).exec(function(err, docs) {
          if (err || !docs.length ) {
            resolve([{ text: this.locationText, needLocation: true }]);
          } else {
            processed.location = docs[0].location;
            this.searchForPlace(processed).then(this.onFoundPlace.bind(this)).then(function(resp) {
              resolve(resp);
            });
          }
        }.bind(this));      

        
      } else {
        this.searchForPlace(processed).then(this.onFoundPlace.bind(this)).then(function(resp) {
          resolve(resp);
        });
      }
    }.bind(this));
    
  },

  onFoundPlace: function(place) {
    if (place) {
      return [{ image: place.coverImage() }, { text: this.placeText(place) }];
      // return [{ text: this.placeText(place) },{ image: place.coverImage() }];
    }
    return [this.notFound, Talk.help];
  },

  processMessage: function(message, reply) {
    let text = message.original;
    let result = {
      needLocation: false,
      query: '',
      modifiers: [],
      sorting: [],
    };

    text = text.replace(/(недалек|ближай|рядом|вокруг|поблизост)\S*/im, function() {
      result.needLocation = true;
      return '';
    }).trim();

    for (let c of localWay.categories) {
      text = text.replace(new RegExp(c.name.replace('+', '\\+'), 'im'), function(m) {
        result.modifiers.push({ type: 'category', category: c }); 
        // return m;
        return '';
      }).trim();
    }
    

    result.query = result.query.replace(/[?!.]/m,' ').replace(/\s+/m,' ').trim().toLowerCase();
    
    // TODO получить amenityName cuisineName 
    result.query = result.query.replace(/кухн\S*/im, function() {
      result.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
      return '';
    });


    if (reply && reply.location) {
      result.needLocation = false;
      result.location = reply.location;
    }
       
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
