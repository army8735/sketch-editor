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
      .assert.elementPresent('#tree .active .name[title="矩形"]')
      .assert.cssProperty('#main .geometry', 'display', 'none')

      .moveToElement('canvas', 150, 150)
      .doubleClick()
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.cssProperty('#main .geometry', 'display', 'block')

      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .moveToElement('canvas', 250, 50)
      .doubleClick()
      .assert.elementPresent('#tree .active .name[title="三角形"]')
      .assert.cssProperty('#main .geometry', 'display', 'block')

      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .assert.elementPresent('#tree .active .name[title="矩形"]')
      .assert.cssProperty('#main .geometry', 'display', 'none')

      .end();
  }
};
