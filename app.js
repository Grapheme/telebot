var Bot = require('./bot');
var TelegramAdapter = require('./adapters/telegram-adapter');

var b = new Bot();
b.addAdapter(new TelegramAdapter(__dirname + '/telegram.token'));
b.start();

