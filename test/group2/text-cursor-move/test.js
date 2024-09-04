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
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#main div.input')
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '80.0859px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '120.129px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '40.043px')
      .assert.cssProperty('#main div.input', 'top', '83px')

      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '103.043px')
      .assert.cssProperty('#main div.input', 'top', '166px')

      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '40.043px')
      .assert.cssProperty('#main div.input', 'top', '83px')

      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '120.129px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .keys(browser.Keys.ARROW_LEFT)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '80.0859px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '0px')
      .assert.cssProperty('#main div.input', 'top', '0px')

      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '0px')
      .assert.cssProperty('#main div.input', 'top', '83px')

      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '63px')
      .assert.cssProperty('#main div.input', 'top', '166px')

      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .assert.cssProperty('#main div.input', 'left', '143.086px')
      .assert.cssProperty('#main div.input', 'top', '166px')

      .end();
  }
};
