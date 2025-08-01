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
      .assert.value('#base64', '[0,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica-Bold","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.cssProperty('#side .text-panel .weight .multi', 'display', 'block')
      .assert.elementPresent('#side .text-panel .weight select option:disabled')

      .updateValue('#side .text-panel .weight select', ['Regular'])
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":7,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.cssProperty('#side .text-panel .weight .multi', 'display', 'none')
      .assert.not.elementPresent('#side .text-panel .weight select option:disabled')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica-Bold","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.cssProperty('#side .text-panel .weight .multi', 'display', 'block')
      .assert.elementPresent('#side .text-panel .weight select option:disabled')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":7,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.cssProperty('#side .text-panel .weight .multi', 'display', 'none')
      .assert.not.elementPresent('#side .text-panel .weight select option:disabled')

      .end();
  }
};
