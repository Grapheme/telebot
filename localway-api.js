'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var request = require('request');



module.exports = class LocalWayApi {
  constructor() {
    this.r = rp.defaults({
      baseUrl: 'http://localway.ru/portal-api'
    });

    this.defaultAgglomeration = '1af000000000000000000000'; // Москва
    this.defaultCategory = '170af0000000000000000000'; // Рестораны

    this.agglomerations().then(function(data) {
      this._agglomerations = data;
    }.bind(this));
  }

  agglomerations() {
    return this.r('/agglomeration').then(function(response) {
      return JSON.parse(response);
    });
  }

  agglomerationReadableIdById(id) {
    return _.result(_.find(this._agglomerations, { _id: id }), 'readableId');
  }

  search(options) {
    return this.r({ 
        url: '/objects/search', 
        qs: {
          agglomeration: options.aid || this.defaultAgglomeration,
          what: options.query,
          sort: options.sortBy,
          pageSize: options.count || 10,
        }
    }).then(function(response) {
      // console.log(response)
      return JSON.parse(response).items;
    });
  }

  searchRandomBest(options) {
    return this.search(_.extend(options, { sortBy: 'rating' })).then(function(p) {
      var best = p.slice(0,10);
      return best[Math.round(Math.random() * best.length)];
    });
  }

  searchClosestBest(options) {
    // 
  }

  image(poiId, imageId) {
    // return request(`https://img.localway.ru/fullsize/${ id }.jpg`);
    let size = '510x270';
    return request(`http://img.localway.ru/scaled/poi/${poiId}/${imageId}/${size}.jpg`);
  }
};
