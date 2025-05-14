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
      .assert.value('#base64', '[0,"矩形"]')
      .assert.cssProperty('.main .select', 'display', 'block')

      .click('#toolbar .geom')
      .assert.cssProperty('.main .select', 'display', 'none')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('.main .select', 'display', 'block')

      .keys('t')
      .assert.cssProperty('.main .select', 'display', 'none')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('.main .select', 'display', 'block')

      .end();
  }
};
