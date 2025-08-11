const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 200, 200)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[0,"1"],[0,"2"]]')

      .end();
  }
};
