var Bot = require('./bot');
var TelegramAdapter = require('./adapters/telegram-adapter');
var fs = require('fs');

var b = new Bot();
b.addAdapter(new TelegramAdapter(fs.readFileSync(__dirname + '/telegram.token', 'utf8').trim()));
b.start();

