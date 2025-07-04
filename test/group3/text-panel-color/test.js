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
      .assert.value('#base64', '[0,[{"location":0,"length":6,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .moveToElement('canvas', 100, 20)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 20)
      .mouseButtonUp(0)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#FF0000')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,0,0,1]},{"location":4,"length":2,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .moveToElement('canvas', 100, 20)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 20)
      .mouseButtonUp(0)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FF')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":4,"length":2,"fontFamily":"Helvetica","fontSize":60,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[78,78,78,1]}]]')

      .end();
  }
};
