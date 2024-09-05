const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 70, 30)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 120, 30)
      .mouseButtonUp(0)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[0,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":3,"length":11,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 30, 200)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 10, 200)
      .mouseButtonUp(0)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":3,"length":5,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":8,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":9,"length":5,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 70, 200)
      .doubleClick()
      .mouseButtonDown(0)
      .moveToElement('canvas', 30, 260)
      .mouseButtonUp(0)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":3,"length":5,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":8,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":9,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":10,"length":3,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":13,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .moveToElement('canvas', 70, 30)
      .doubleClick()
      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 30, 260)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .click('#button3')
      .assert.value('#base64', '[3,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":2,"length":7,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":9,"length":5,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')

      .end();
  }
};
