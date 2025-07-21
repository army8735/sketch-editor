const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 100, 100)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .assert.cssProperty('#main .geometry .item', 'left', '158.713px')
      .assert.cssProperty('#main .geometry .item', 'top', '14.2385')
      .assert.cssProperty('#main .geometry .item', 'transform', 'matrix(-0.866025, 0.5, 0.5, 0.866025, 0, 0)')
      .assert.cssProperty('#main .geometry .item .vt[title="1"]', 'transform', 'matrix(1, 0, 0, 1, 149.713, 0)')

      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="1"]', 10, 10)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .end();
  }
};
