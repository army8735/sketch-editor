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
      .moveToElement('canvas', 40, 40)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 70, 40)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 110)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry .vt.cur')
      .click('#button6')
      .assert.value('#base64', '')
      .click('#button2')
      .assert.value('#base64', '')

      .end();
  }
};
