'use strict';
let requireDir = require('require-dir');
let _ = require('lodash');

let Talk;
module.exports = Talk = {};

Talk.dialogs = _.chain(requireDir('./bot-talk')).values().sortBy('priority').value();
Talk.defaultDialog = _.find(Talk.dialogs, { default: true });

Talk.help = 'Напишите простую команду, например "найди парк горького" или "покажи старбакс"';
