const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 70, 30)
      .mouseButtonUp(0)
      .assert.value('#side .text-panel .fs input', '72')
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.not.visible('.picker_wrapper')
      .click('#button3')
      .assert.value('#base64', '[0,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":2,"length":3,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":3,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":36,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 30, 100)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 130, 100)
      .mouseButtonUp(0)
      .assert.value('#side .text-panel .fs input', '')
      .assert.attributeEquals('#side .text-panel .fs input', 'placeholder', '多个')
      .moveToElement('#side .text-panel .fs input', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":75,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":38,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 30, 100)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 130, 100)
      .mouseButtonUp(0)
      .assert.value('#side .text-panel .fs input', '')
      .assert.attributeEquals('#side .text-panel .fs input', 'placeholder', '多个')
      .moveToElement('#side .text-panel .fs input', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":85,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 30, 180)
      .doubleClick()
      .click('#side .text-panel .al .center')
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":85,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":2,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 140, 100)
      .doubleClick()
      .click('#side .text-panel .al .right')
      .click('#button3')
      .assert.value('#base64', '[5,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":85,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":5,"length":2,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":7,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":2,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .end();
  }
};
