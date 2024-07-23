const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 30, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main div.hover', 'display', 'none')
      .assert.not.elementPresent('#tree dt.hover')

      .moveToElement('canvas', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('canvas', 200, 200)
      .mouseButtonUp(0)
      .moveToElement('canvas', 20, 20)
      .assert.cssProperty('#main div.hover', 'display', 'none')
      .assert.not.elementPresent('#tree dt.hover')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 150, 50)
      .assert.cssProperty('#main div.hover', 'display', 'block')
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '画板')
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 30, 30)
      .assert.cssProperty('#main div.hover', 'display', 'none')
      .assert.not.elementPresent('#tree dt.hover')
      .keys(browser.Keys.NULL)

      .end();
  }
};
