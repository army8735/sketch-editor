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

      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .click('#side .point-panel .open')
      .assert.not.elementPresent('#main .geometry svg path[title="3"]')

      .moveToElement('#main .geometry .vt[title="3"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      // 移开最后顶点后呈现add-pen
      .assert.not.cssClassPresent('#main .canvas-c', ['add-pen'])
      .moveToElement('canvas', 350, 350)
      .assert.cssClassPresent('#main .canvas-c', ['add-pen'])
      .assert.not.cssClassPresent('#main .canvas-c', ['fin-pen'])
      // 移入开始顶点后呈现fin-pen
      .moveToElement('#main .geometry .vt[title="0"]', 0, 0)
      .assert.not.cssClassPresent('#main .canvas-c', ['add-pen'])
      .assert.cssClassPresent('#main .canvas-c', ['fin-pen'])
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#side .point-panel .close', 'display', 'none')
      .assert.cssProperty('#side .point-panel .open', 'display', 'block')
      .assert.elementPresent('#main .geometry svg path[title="3"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#side .point-panel .close', 'display', 'block')
      .assert.cssProperty('#side .point-panel .open', 'display', 'none')
      .assert.not.elementPresent('#main .geometry svg path[title="3"]')

      .end();
  }
};
