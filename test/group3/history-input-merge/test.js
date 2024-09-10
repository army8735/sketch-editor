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
      .assert.value('#base64', '[0,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 300, 30)
      .doubleClick()
      .keys('4')
      .keys('5')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 20, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '90.0859px')
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '143.477px')
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":5,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 300, 30)
      .doubleClick()
      .keys('4')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .doubleClick()
      .keys('5')
      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 300, 30)
      .doubleClick()
      .keys('5')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '0')
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')


      .end();
  }
};
