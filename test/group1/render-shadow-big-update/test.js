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
      .moveToElement('#side .shadow-panel .line[title="0"] .x', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button1')
      .assert.value('#base64', '')
      .end();
  }
};
