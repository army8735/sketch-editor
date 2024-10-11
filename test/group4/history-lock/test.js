const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.elementPresent('.sketch-editor-context-menu')
      .assert.containsText('.sketch-editor-context-menu .lock span', '1')
      .moveToElement('.sketch-editor-context-menu .lock span', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .pause(20)
      .assert.elementPresent('#tree .lock')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.not.elementPresent('#tree .lock')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.elementPresent('#tree .lock')

      .end();
  }
};
