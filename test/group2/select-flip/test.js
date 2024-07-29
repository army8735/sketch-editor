const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'left', '10px')
      .assert.cssProperty('#main .select', 'top', '10px')
      .assert.cssProperty('#main .select', 'width', '100px')
      .assert.cssProperty('#main .select', 'height', '100px')
      .assert.cssProperty('#main .select', 'transform', 'none')

      .moveToElement('canvas', 130, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'left', '120px')
      .assert.cssProperty('#main .select', 'top', '10px')
      .assert.cssProperty('#main .select', 'width', '100px')
      .assert.cssProperty('#main .select', 'height', '100px')
      .assert.cssProperty('#main .select', 'transform', 'none')

      .moveToElement('canvas', 20, 130)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'left', '10px')
      .assert.cssProperty('#main .select', 'top', '120px')
      .assert.cssProperty('#main .select', 'width', '100px')
      .assert.cssProperty('#main .select', 'height', '100px')
      .assert.cssProperty('#main .select', 'transform', 'none')

      .end();
  }
};
