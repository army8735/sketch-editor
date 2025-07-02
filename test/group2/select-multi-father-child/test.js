const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0]')

      .moveToElement('canvas', 50, 50)
      .keys(browser.Keys.META)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[1,"画框"]')

      .moveToElement('canvas', 150, 150)
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[2,"矩形"]')

      .moveToElement('canvas', 50, 50)
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[3,"矩形"]')

      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#tree .name[title="画框"]')
      .click('#button4')
      .assert.value('#base64', '[4,"画框"]')

      .keys(browser.Keys.META)
      .click('#tree .name[title="矩形"]')
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[5,"矩形"]')

      .keys(browser.Keys.META)
      .click('#tree .name[title="画框"]')
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[6,"矩形"]')

      .end();
  }
};
