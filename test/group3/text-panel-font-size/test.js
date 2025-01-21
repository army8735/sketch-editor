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
      .assert.value('#base64', '[0,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.value('#side .text-panel .fs input', '')
      .assert.attributeEquals('#side .text-panel .fs input', 'placeholder', '多个')

      .click('#side .text-panel .fs input')
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":25,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":37,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.value('#side .text-panel .fs input', '')
      .assert.attributeEquals('#side .text-panel .fs input', 'placeholder', '多个')

      .click('#side .text-panel .fs input')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":35,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":47,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .click('#side .text-panel .fs input')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":34,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":46,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":35,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":47,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[5,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":34,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":46,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .updateValue('#side .text-panel .fs input', ['20', browser.Keys.ENTER])
      .click('#button3')
      .assert.value('#base64', '[6,[{"location":0,"length":7,"fontFamily":"Helvetica","fontSize":20,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')
      .assert.value('#side .text-panel .fs input', '20')
      .assert.attributeEquals('#side .text-panel .fs input', 'placeholder', '')

      .end();
  }
};
