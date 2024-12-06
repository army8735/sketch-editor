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
      .moveToElement('#side .fill-panel .line .pick', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .gradient', 'display', 'block')
      .assert.cssProperty('#main .gradient', 'left', '10px')
      .assert.cssProperty('#main .gradient', 'top', '10px')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')

      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(1)
      .moveToElement('canvas', 220, 210)
      .mouseButtonUp(1)
      .assert.cssProperty('#main .gradient', 'display', 'block')
      .assert.cssProperty('#main .gradient', 'left', '30px')
      .assert.cssProperty('#main .gradient', 'top', '20px')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')

      .moveToElement('canvas', 200, 200)
      .keys(browser.Keys.SPACE)
      .mouseButtonDown(0)
      .moveToElement('canvas', 220, 210)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .gradient', 'display', 'block')
      // .assert.cssProperty('#main .gradient', 'left', '50px')
      // .assert.cssProperty('#main .gradient', 'top', '30px')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .gradient', 'display', 'none')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'none')
      .assert.cssProperty('#main .select', 'display', 'block')

      .end();
  }
};
