const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .keys(browser.Keys.META)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .assert.cssClassPresent('#main .select', ['select', 'symbol-instance'])
      .assert.cssProperty('#main .select .l', 'pointer-events', 'none')
      .assert.cssProperty('#main .select .tl', 'display', 'none')
      .assert.cssClassPresent('#side .basic-panel .input-unit', ['input-unit', 'disabled'])

      .end();
  }
};
