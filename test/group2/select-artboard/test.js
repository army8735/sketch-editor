const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 20, 120)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0]')

      .moveToElement('canvas', 220, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[1,"画板2"]')

      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 20, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[2,"画板2"]')
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 20, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[3,"画板2"],[3,"画板"]]')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 220, 220)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[4]')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[5,"1"]')
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[6,"画板"]')
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[7,"1"]')
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 20, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[8,"1"]')

      .end();
  }
};
