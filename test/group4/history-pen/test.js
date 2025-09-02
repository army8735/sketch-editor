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
      .assert.cssClassPresent('#main .canvas-c', 'add-pen')
      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .assert.not.cssClassPresent('#main .canvas-c', 'add-pen')
      .assert.elementPresent('#tree dt span.name')
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 10)
      .assert.cssClassPresent('#main .canvas-c', 'add-pen')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 110)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 10, 10)
      .assert.not.cssClassPresent('#main .canvas-c', 'add-pen')
      .assert.cssClassPresent('#main .canvas-c', 'fin-pen')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '')
      .click('#button2')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry svg path[title="1"]')
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#main .geometry svg path[title="1"]')
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '')

      .end();
  }
};
