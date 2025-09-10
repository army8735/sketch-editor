const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonClick(0)
      .keys(browser.Keys.META)
      .keys('a')
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[0,"f"],[0,"f2"]]')

      .moveToElement('canvas', 20, 20)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[1]')

      .moveToElement('canvas', 50, 50)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[2,"f"]')

      .moveToElement('canvas', 20, 20)
      .mouseButtonClick(0)
      .moveToElement('canvas', 190, 50)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[3]')

      .end();
  }
};
