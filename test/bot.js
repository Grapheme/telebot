/* global beforeEach, afterEach, describe, it, spyOn, xdescribe, xit */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var Bot = require('../bot');
var BotPhrases = require('../bot-phrases');

var messages = require('./data/messages').items;



describe('Bot', function() {
  describe('#processMessage()', function() {
    var b = new Bot();

    it('should greet user', function() {
      for (let m of messages) {
        let result = b.processMessageText(m.text, false);
        let greeting = BotPhrases.greetings[0];
        if (Boolean(m.greeting)) {
          expect(result.offtopic).to.include(greeting);  
        }
        
        // console.log(m.text, ' -> ', result.offtopic.join(' \\n'), '"' + result.query + '"', result.modifiers.join(','));
      }
    });

    it('should answer offtopic phrases', function() {
      for (let m of messages) {
        let result = b.processMessageText(m.text, false);
        let offtopic = BotPhrases.offtopic[0];
        if (Boolean(m.offtopic)) {
          expect(result.offtopic).to.include(offtopic);  
        }
      }
    });

    it('should find query in text', function() {
      for (let m of messages) {
        let result = b.processMessageText(m.text, false);
        if (Boolean(m.query)) {
          expect(result.query).to.eql(m.query);  
        }
      }
    });

    xit('should find query modifiers in text', function() {
      
    });
  });
  
  xit('should search places with query', function() {
    
  });

  xit('should differ name and category in query', function() {
    for (let m of messages) {
      let result = b.processMessageText(m.text, false);
    }
  });
});