const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .assert.elementPresent('#main div.input')
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '40.043px')
      .assert.cssProperty('#main div.input', 'top', '0px')
      .assert.domPropertyEquals('#side .text-panel .pick', 'title', '#000000')

      .moveToElement('canvas', 70, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '80.0859px')
      .assert.cssProperty('#main div.input', 'top', '0px')
      .assert.domPropertyEquals('#side .text-panel .pick', 'title', '#FF4242')

      .moveToElement('canvas', 90, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '80.0859px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .moveToElement('canvas', 130, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '120.129px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .moveToElement('canvas', 10, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '0px')
      .assert.cssProperty('#main div.input', 'top', '83px')

      .keys(browser.Keys.ESCAPE)
      .assert.cssProperty('#main div.input', 'opacity', '0')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .moveToElement('canvas', 30, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.input', 'opacity', '0')

      .end();
  }
};
