const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.elementPresent('#tree .symbol-instance')
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.elementPresent('.sketch-editor-context-menu')
      .assert.cssProperty('.sketch-editor-context-menu .un-bind', 'display', 'block')
      .moveToElement('.sketch-editor-context-menu .un-bind', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('.sketch-editor-context-menu', 'display', 'none')
      .assert.not.elementPresent('#tree .symbol-instance')
      .assert.elementPresent('#tree span[name="2"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#tree .symbol-instance')
      .assert.elementPresent('#tree span[name="2"]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#tree .symbol-instance')
      .assert.elementPresent('#tree span[name="2"]')

      .end();
  }
};
