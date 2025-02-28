const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .keys(browser.Keys.META)
      .click('#tree span.name[title="2"]')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 30, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 60, 7)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 90, 13)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .moveToElement('canvas', 110, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 107, 60)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 113, 90)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .moveToElement('canvas', 30, 220)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 60, 217)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 90, 223)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .moveToElement('canvas', 10, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 7, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 13, 210)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '')

      .end();
  }
};
