const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 50, 50)
      .keys(browser.Keys.META)
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 150)
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.not.elementPresent('#tree .active .name[title="编组"]')
      .assert.not.elementPresent('#tree .active .name[title="矩形"]')
      .assert.elementPresent('#tree .active .name[title="三角形"]')
      .moveToElement('canvas', 250, 250)
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.not.elementPresent('#tree .active .name[title="编组"]')
      .assert.elementPresent('#tree .active .name[title="矩形"]')
      .assert.elementPresent('#tree .active .name[title="三角形"]')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.elementPresent('#tree .active .name[title="编组"]')
      .assert.not.elementPresent('#tree .active .name[title="矩形"]')
      .assert.not.elementPresent('#tree .active .name[title="三角形"]')
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 250, 250)
      .keys(browser.Keys.META)
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 150)
      .assert.not.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.not.elementPresent('#tree .active .name[title="编组"]')
      .assert.elementPresent('#tree .active .name[title="矩形"]')
      .assert.elementPresent('#tree .active .name[title="三角形"]')
      .moveToElement('canvas', 50, 50)
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.not.elementPresent('#tree .active .name[title="编组"]')
      .assert.elementPresent('#tree .active .name[title="矩形"]')
      .assert.elementPresent('#tree .active .name[title="三角形"]')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#tree .active .name[title="椭圆形"]')
      .assert.elementPresent('#tree .active .name[title="编组"]')
      .assert.not.elementPresent('#tree .active .name[title="矩形"]')
      .assert.not.elementPresent('#tree .active .name[title="三角形"]')
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .end();
  }
};
