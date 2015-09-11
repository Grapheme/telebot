'use strict';
let fs = require('fs');
let Bot = require('./src/bot');

let b = new Bot({
  adapters: {
    'telegram': fs.readFileSync(__dirname + '/telegram.token', 'utf8').trim()  
  }
});

b.start();
