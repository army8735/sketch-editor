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
      .assert.value('#base64', '[0,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .assert.value('#side .text-panel .fs input', '72')
      .assert.value('#side .text-panel .ls input', '0')

      .click('#side .text-panel .fs input')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .click('#side .text-panel .ls input')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":62,"fontWeight":400,"fontStyle":"normal","letterSpacing":-1,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .assert.value('#side .text-panel .fs input', '62')
      .assert.value('#side .text-panel .ls input', '-1')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":62,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .assert.value('#side .text-panel .fs input', '62')
      .assert.value('#side .text-panel .ls input', '0')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .assert.value('#side .text-panel .fs input', '72')
      .assert.value('#side .text-panel .ls input', '0')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":62,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .assert.value('#side .text-panel .fs input', '62')
      .assert.value('#side .text-panel .ls input', '0')

      .end();
  }
};
