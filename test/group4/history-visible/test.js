const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('#tree .name[title="椭圆形"]')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('#tree .name[title="矩形"]')
      .keys(browser.Keys.META)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[0,"矩形"],[0,"椭圆形"]]')

      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.containsText('.sketch-editor-context-menu .hide span', '2')
      .moveToElement('.sketch-editor-context-menu .hide span', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .pause(20)
      .assert.not.elementPresent('#tree .visible.t')
      .assert.elementPresent('#tree .visible')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.elementPresent('#tree .name[title="矩形"]+.t')
      .assert.not.elementPresent('#tree .name[title="椭圆形"]+.t')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.not.elementPresent('#tree .visible.t')

      .end();
  }
};
