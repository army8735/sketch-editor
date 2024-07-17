const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .click('#button3')
      .assert.value('#base64', '[0,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":2,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":8,"length":3,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.not.elementPresent('#side .text-panel .al .cur')

      .click('.side .text-panel .left')
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['left', 'cur'])

      .click('.side .text-panel .center')
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['center', 'cur'])

      .click('.side .text-panel .right')
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":2,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['right', 'cur'])

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['center', 'cur'])

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[5,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['left', 'cur'])

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[6,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":2,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":8,"length":3,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.not.elementPresent('#side .text-panel .al .cur')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[7,[{"location":0,"length":11,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.cssClassPresent('#side .text-panel .al .cur', ['left', 'cur'])

      .end();
  }
};
