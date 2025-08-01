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
      .assert.value('#base64', '[0,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":60,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.value('#side .text-panel .lh input', '')
      .assert.attributeEquals('#side .text-panel .lh input', 'placeholder', '多个')

      .click('#side .text-panel .lh input')
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":28.59765625,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":61,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.value('#side .text-panel .lh input', '')
      .assert.attributeEquals('#side .text-panel .lh input', 'placeholder', '多个')

      .click('#side .text-panel .lh input')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":38.59765625,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":71,"paragraphSpacing":0,"color":[79,79,79,1]}]]')

      .click('#side .text-panel .lh input')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":37.59765625,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":70,"paragraphSpacing":0,"color":[79,79,79,1]}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":38.59765625,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":71,"paragraphSpacing":0,"color":[79,79,79,1]}]]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[5,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":37.59765625,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":70,"paragraphSpacing":0,"color":[79,79,79,1]}]]')

      .updateValue('#side .text-panel .lh input', ['40', browser.Keys.ENTER])
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[6,[{"location":0,"length":4,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":40,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":4,"length":3,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":40,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.value('#side .text-panel .lh input', '40')
      .assert.attributeEquals('#side .text-panel .lh input', 'placeholder', '')

      .updateValue('#side .text-panel .lh input', ['0', browser.Keys.ENTER])
      .updateValue('#side .text-panel .fs input', ['20', browser.Keys.ENTER])
      .pause(20)
      .click('#button3')
      .assert.value('#base64', '[7,[{"location":0,"length":7,"fontFamily":"Helvetica","fontSize":20,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]')
      .assert.value('#side .text-panel .lh input', '')
      .assert.attributeEquals('#side .text-panel .lh input', 'placeholder', '23')

      .end();
  }
};
