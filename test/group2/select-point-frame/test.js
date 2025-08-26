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
      .moveToElement('canvas', 50, 5)
      .mouseButtonDown(0)
      .moveToElement('canvas', 200, 200)
      .assert.cssProperty('#main .frame', 'display', 'block')
      .mouseButtonUp(0)
      .assert.cssProperty('#main .frame', 'display', 'none')
      .assert.not.cssClassPresent('#main .geometry .vt[title="0"]', ['vt', 'cur'])
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 200, 200)
      .assert.cssProperty('#main .frame', 'display', 'block')
      .mouseButtonUp(0)
      .assert.cssProperty('#main .frame', 'display', 'none')
      .assert.not.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])

      .end();
  }
};
