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
      .assert.elementPresent('#side .export-panel .add')
      .assert.not.elementPresent('#side .export-panel .item')
      .assert.not.elementPresent('#side .export-panel .preview')

      .click('#side .export-panel .add')
      .pause(20)
      .assert.elementPresent('#side .export-panel .add')
      .assert.elementPresent('#side .export-panel .item')
      .assert.elementPresent('#side .export-panel .preview')

      .click('#side .export-panel .add')
      .assert.elementPresent('#side .export-panel .item[title="0"]')
      .assert.elementPresent('#side .export-panel .item[title="1"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#side .export-panel .item[title="0"]')
      .assert.not.elementPresent('#side .export-panel .item[title="1"]')

      .click('#side .export-panel .del')
      .assert.not.elementPresent('#side .export-panel .item')
      .assert.not.elementPresent('#side .export-panel .preview')

      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.META)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 150, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#side .export-panel .add')
      .assert.elementPresent('#side .export-panel .item')
      .assert.not.elementPresent('#side .export-panel .preview')

      .end();
  }
};
