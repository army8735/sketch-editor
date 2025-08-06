const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 20, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('a')
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[0,"2"]')

      .end();
  }
};
