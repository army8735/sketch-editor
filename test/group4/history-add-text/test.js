const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.elementPresent('#toolbar .sel.item.active')
      .assert.elementPresent('#toolbar .sel.item.active .sub .cur[title="select"]')
      .click('#toolbar .text')
      .assert.elementPresent('#toolbar .text.item.active')
      .assert.not.elementPresent('#toolbar .sel.item.active')
      .assert.not.elementPresent('#toolbar .sel.item.active .sub .cur[title="select"]')
      .assert.elementPresent('#toolbar .sel.item')
      .assert.elementPresent('#toolbar .sel.item .sub [title="select"]')

      .assert.cssClassPresent('#main .canvas-c', ['canvas-c'])
      .moveToElement('canvas', 50, 50)
      .assert.cssClassPresent('#main .canvas-c', ['canvas-c', 'text'])
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#toolbar .sel.item.active')
      .assert.not.elementPresent('#toolbar .text.item.active')

      .click('#toolbar .text')
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('#main .select.text')
      .assert.elementPresent('#main div.input')
      .assert.cssProperty('#main div.input', 'opacity', '0')
      .click('#button2')
      .assert.value('#base64', '')
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":4,"fontFamily":"Arial","fontStyle":"normal","fontWeight":400,"fontSize":16,"lineHeight":0,"textAlign":0,"textDecoration":[],"letterSpacing":0,"paragraphSpacing":0,"color":[0,0,0,1]}]]')
      .click('#button4')
      .assert.value('#base64', '[2,"输入文本"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[3]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[4]')

      .end();
  }
};
