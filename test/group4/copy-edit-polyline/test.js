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
      .moveToElement('canvas', 10, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 50)
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[0,]')

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('c')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 150)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('v')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .select', 'left', '10px')
      .assert.cssProperty('#main .select', 'top', '10px')
      // 老的不再选择
      .assert.not.cssClassPresent('dl[uuid="EEB43720-A2E0-444C-9E29-37489788E994"] dt', 'active')
      .click('#button6')
      .assert.value('#base64', '[1,]')

      .end();
  }
};
