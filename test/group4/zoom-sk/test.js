const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 150, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.value('#base64', '1')

      .keys(browser.Keys.META)
      .keys('+')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 150, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.value('#base64', '2')

      .keys(browser.Keys.META)
      .keys('-')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 150, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.value('#base64', '1')

      .end();
  }
};
