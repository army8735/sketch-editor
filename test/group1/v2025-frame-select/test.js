const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[0]')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 20)
      .mouseButtonClick(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[1,"f"]')

      .moveToElement('canvas', 450, 450)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[2]')

      .moveToElement('canvas', 120, 120)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[3,"f2"]')

      .moveToElement('canvas', 450, 450)
      .mouseButtonClick(0)
      .keys(browser.Keys.META)
      .moveToElement('canvas', 120, 120)
      .mouseButtonClick(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[4,"f2"]')

      .moveToElement('canvas', 180, 180)
      .mouseButtonClick(0)
      .click('#button4')
      .assert.value('#base64', '[5,"f2"]')

      .moveToElement('canvas', 450, 450)
      .mouseButtonClick(0)
      .keys(browser.Keys.META)
      .moveToElement('canvas', 180, 180)
      .mouseButtonClick(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[6,"r"]')

      .end();
  }
};
