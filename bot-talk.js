'use strict';
// let requireDir = require('require-dir');
let _ = require('lodash');

let Talk;
module.exports = Talk = {};

Talk.dialogs = _.sortBy([
  require('./bot-talk/simple'),
  require('./bot-talk/greeting'),
  require('./bot-talk/place-search'),
  // require('./food-assitant'),
  
  
], 'priority');

Talk.defaultDialog = _.find(Talk.dialogs, { default: true });

Talk.unkonwnPhrase = 'Ничего не понял';
Talk.help = 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"';
