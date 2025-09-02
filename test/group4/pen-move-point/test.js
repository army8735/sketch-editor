const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .keys('p')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 50, 50)
      .mouseButtonUp(0)
      .moveToElement('canvas', 100, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .moveToElement('canvas', 50, 100)
      .mouseButtonUp(0)
      .assert.elementPresent('#main .geometry svg path[title="1"]')
      .assert.not.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '')
      .click('#button2')
      .assert.value('#base64', '')

      .end();
  }
};
