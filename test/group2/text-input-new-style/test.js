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
      .assert.value('#base64', '[0,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[74,255,137,1]}]]')
      .click('#button5')
      .assert.value('#base64', '[1,"123"]')

      .moveToElement('canvas', 80, 30)
      .doubleClick()
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .keys(browser.Keys.ESCAPE)
      .keys('0')
      .click('#button3')
      .assert.value('#base64', '[2,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[74,255,137,1]}]]')
      .click('#button5')
      .assert.value('#base64', '[3,"1203"]')

      .moveToElement('canvas', 30, 130)
      .doubleClick()
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .moveToElement('canvas', 80, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys('4')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[74,255,137,1]}]]')
      .click('#button5')
      .assert.value('#base64', '[5,"12403"]')

      .moveToElement('canvas', 80, 130)
      .doubleClick()
      .click('#side .text-panel .picker-btn b')
      .updateValue('.picker_editor input', '#0000FFFF')
      .moveToElement('canvas', 80, 130)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.domPropertyEquals('#side .text-panel .picker-btn b', 'title', 'rgba(0,0,255,1)')
      .keys('5')
      .keys(browser.Keys.NULL)
      .click('#button3')
      .assert.value('#base64', '[6,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":2,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[255,66,66,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]},{"location":4,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[74,255,137,1]},{"location":5,"length":1,"fontFamily":"Helvetica","fontSize":72,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,255,1]}]]')
      .click('#button5')
      .assert.value('#base64', '[7,"124035"]')

      .end();
  }
};
