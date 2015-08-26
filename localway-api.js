'use strict';
var _ = require('lodash');
var request = require('request');
var levenshtein = require('fast-levenshtein');
var Q = require('q');
// request.debug = true;

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

    this.agglomerations().then(function(data) {
      this._agglomerations = data;
    }.bind(this));

    this.r('/category', function(err, response, body) {
      this.categories = JSON.parse(body);
    }.bind(this));
  }

  agglomerations() {
    let deferred = Q.defer();
    this.r('/agglomeration', function(err, response, body) {
       deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
  }

  agglomerationReadableIdById(id) {
    return _.result(_.find(this._agglomerations, { _id: id }), 'readableId');
  }

  search(options) {
    let deferred = Q.defer();
    this.r({ 
        url: '/objects/search', 
        qs: {
          agglomeration: options.aid || this.defaultAgglomeration,
          what: options.query,
          sort: options.sortBy,
          pageSize: options.count || 10,
        }
    }, function(err, response, body) {
      if (!err) {
        deferred.resolve(JSON.parse(body).items);
      }
    });

    return deferred.promise;
  }

  searchRandomBest(options) {
    return this.search(_.extend(options, { sortBy: 'rating' })).then(function(p) {
      let best = p.slice(0,10);
      return best[Math.round(Math.random() * best.length)];
    });
  }
  
  // searchClosestBest(options) {
    
  // }

  image(poiId, imageId) {
    // return request(`https://img.localway.ru/fullsize/${ id }.jpg`);
    let size = '510x270';
    return request(`http://img.localway.ru/scaled/poi/${poiId}/${imageId}/${size}.jpg`);
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
};
