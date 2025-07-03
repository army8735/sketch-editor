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
      .assert.cssProperty('#side .point-panel .close', 'display', 'none')
      .assert.cssProperty('#side .point-panel .open', 'display', 'block')
      .assert.elementPresent('#main .geometry svg path[title="3"]')

      .click('#side .point-panel .open')
      .assert.cssProperty('#side .point-panel .close', 'display', 'block')
      .assert.cssProperty('#side .point-panel .open', 'display', 'none')
      .assert.not.elementPresent('#main .geometry svg path[title="3"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#side .point-panel .close', 'display', 'none')
      .assert.cssProperty('#side .point-panel .open', 'display', 'block')
      .assert.elementPresent('#main .geometry svg path[title="3"]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#side .point-panel .close', 'display', 'block')
      .assert.cssProperty('#side .point-panel .open', 'display', 'none')
      .assert.not.elementPresent('#main .geometry svg path[title="3"]')

      .click('#side .point-panel .end')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .assert.cssProperty('#side .point-panel', 'display', 'none')

      .end();
  }
};
