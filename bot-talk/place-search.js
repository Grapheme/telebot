'use strict';
var Q = require('q');
var _ = require('lodash');
var LocalWayApi = require('../localway-api');
var localWay = new LocalWayApi();


// // Talk.query
// Talk.queryModifier = {
//   '(лучш|хорош|неплох)\\S*': { 
//     type: 'best',
//     response: 'Посмотрите QUERY с самой высокой оценкой'
//   },
//   '(недалек|ближайщ|рядом|вокруг)\\S*': {
//     type: 'near', // запрашивать местоположение, сортировать по расстоянию
//   },
//   '(недорог|дешев)\\S*': {
//     type: 'cheap' //  - сортировать по цене
//   }
// };


   // message.query = message.query.replace(/[?!.]/m,' ').replace(/\s+/m,' ').trim().toLowerCase();


    // // TODO получить amenityName cuisineName 
    // message.query = message.query.replace(/кухн\S*/im, function() {
    //   message.modifiers.push({ type: 'category', category: { name: 'Ресторан' }});
    //   return '';
    // });

    // if (!message.sorting.length) {
    //   // случайный из нескольких c высоким рейтингом
    //   message.sorting.push({ type: 'randomBest' });
    // }


module.exports = {
  default: true,
  priority: 1,
  match: [
    '(найд|найти|искать|ищи|где|подскаж|покаж|как)\\S*\\s*'
  ],


  response: function(message) {



    // return ['надо искать места', 'по очереди', 'prislilat', 'soobshenia'];
    console.log('sdsd', message);
    return 'надо искать ' + message.original;
  },

  processMessage: function() {},


  searchForPlace(processedMessage) {
    var deferred = Q.defer();

    let searchOptions = { query: processedMessage.query };
    let c = _(processedMessage.modifiers).find({ type: 'category' });
    if (c) {
      searchOptions.categoryName = c.category.name;
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
