const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[0,"abc"],[0,"123"],[0,"456"],[0,"789"],[0,"defg"],[0,"hijk"],[0,"lmnopqrstuvwxy z"]]')
      .click('#button3')
      .assert.value('#base64', '[[1,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]],[1,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":1,"length":2,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]}]],[1,[{"location":0,"length":3,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]],[1,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":2,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]],[1,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":1,"length":2,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]],[1,[{"location":0,"length":1,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":1,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":2,"length":1,"fontFamily":"Helvetica","fontSize":12,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[0,0,0,1]},{"location":3,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]],[1,[{"location":0,"length":15,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]},{"location":15,"length":1,"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":1,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[79,79,79,1]}]]]')
      .end();
  }
};
