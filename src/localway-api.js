'use strict';
var _ = require('lodash');
var request = require('request');
// var levenshtein = require('fast-levenshtein');
var Q = require('q');
// request.debug = true;

let geolib = require('geolib');

let fs = require('fs');


var tmp = './tmp';
if (!fs.existsSync(tmp)) {
  fs.mkdirSync(tmp);
} else {
  fs.readdir(tmp, function(err, files){
    files.forEach(function(f) {  fs.unlink(tmp + '/' + f); });
  });
}




module.exports = class LocalWayApi {
  constructor() {
    this.r = request.defaults({
      baseUrl: 'http://localway.ru/portal-api',
      // auth: {
        // user: 'devel',
        // pass: 'devel'
      // } 
    });

    this.defaultAgglomeration = '1af000000000000000000000'; // Москва
    this.defaultCategory = '170af0000000000000000000'; // Рестораны

    this.requestPromise('/agglomeration').then(function(data) {
      this.agglomerations = data;
    }.bind(this));

    this.requestPromise('/section').then(function(data) {
      this.sections = data;
    }.bind(this));

    this.requestPromise('/category').then(function(data) {
      this.categories = data;
    }.bind(this));
  }

  requestPromise(options) {
    let deferred = Q.defer();
    this.r(options, function(err, response, body) {
      if (!err) {
        deferred.resolve(JSON.parse(body));
      } else {
        deferred.reject(err);
      }
    });
    return deferred.promise;
  }

  agglomerationReadableIdById(id) {
    return _.result(_.find(this.agglomerations, { _id: id }), 'readableId');
  }

  search(options) {
    console.log('search', options);

    let query = {
      pageSize: options.count || 50,
    };



    if (options.aid) {
      query.agglomeration = options.aid;
    } else if (options.latitude && !options.aid) {
      console.log('find agglomeration');
      let closest = _.sortBy(this.agglomerations, function(a) {
        return geolib.getDistance({ 
          latitude: a.centroid.lat, 
          longitude: a.centroid.lon 
        }, { 
          latitude: options.latitude, 
          longitude: options.longitude 
        });
      })[0];

      console.log('agglomeration', closest.name);
      query.agglomeration = closest._id;
    } else {
      query.agglomeration = this.defaultAgglomeration;
    }

    if (options.query) {
      query.what = options.query;
    }

    if (options.sortBy) {
      query.sort = options.sortBy;
    }
    
    if (options.categoryName) {
      query.categoryName = options.categoryName;
    }

    return this.requestPromise({ 
      url: '/objects/search', 
      qs: query
    }).then(function(data) {
      return data.items;
    });
  }



  searchRandomBest(options) {
    return this.search(_.extend({ sortBy: 'rating' }, options)).then(function(places) {
      let top =  _.chain(places).filter(function(p) { return p.rating > 4.7; }).value();
      let top10 = _.chain(places).slice(0,10).value();
      let best = _.max([top, top10], function(q) { return q.length; });
      let p = _.sample(best);
      return p ? [p] : [];
    });
  }
  
  searchClosest(options) {
    return this.search(_.extend({ sortBy: 'geoDistance' }, options)).then(function(places) {  
      console.log('sdsd places', places.length);
      return [places[0]];
    });
  }

  searchBestClosest(options) {
    // return this.search(_.extend({ sortBy: 'geoDistance' }, options)).then(function(places) {
      // return places[0];
    // });
  }

  searchRandomCheapest(options) {
    return this.searchRandomBest(_.extend({ sortBy: 'price', 'sort.dir': 'asc' }, options));
  }


  image(poiId, imageId, size) {
    if (!size) {
      size = '510x270';
    }


    let url = `http://img.localway.ru/scaled/poi/${poiId}/${imageId}/${size}.jpg`;
    let name = `${ tmp }/${imageId}-${size}.jpg`;

    return Q.Promise(function(resolve, reject) {
      if (fs.existsSync(name)) {
        return resolve(name);
      }
      
      let r = request(url, function(err, response, body) {
        if (err) return reject(err);
        console.log('download err', err, url, response.constructor.name);
        resolve(name);
      });

      r.pipe(fs.createWriteStream(name));
    });
  }

  matchPlaces(places, query) {
    function includeString(a,b) {
      return a.toLowerCase().indexOf(b.toLowerCase()) > -1;
    }
    
    return _.find(places, function(p) {  
      // return _.find(p.aliases, function(a) { return levenshtein.get(a, query) < 4; }) || include(p.name, query);
      return _.include(p.aliases, query) || includeString(p.name, query);
    });
  }

  preparePlace(p) {    
    let poiId = p._id.split('af')[0];
    let city = this.agglomerationReadableIdById(p.agglomeration);
    p.link = `https://localway.ru/${ city }/poi/${ p.readableId }_${ poiId }`;
    // p.image = `http://img.localway.ru/scaled/poi/${poiId}/${ p.cover }/510x270.jpg`;
    p.coverImage = function() {
      return this.image(poiId, p.cover);
    }.bind(this);

    return p;
  }
};
