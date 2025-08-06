const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 340, 320)
      .mouseButtonDown(0)
      .moveToElement('canvas', 330, 321)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[0,"矩形"]')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 340, 320)
      .mouseButtonDown(0)
      .moveToElement('canvas', 310, 321)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[1,"2"]')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 100, 260)
      .mouseButtonDown(0)
      .moveToElement('canvas', 101, 320)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[2,"1"],[2,"2"]]')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 150, 150)
      .mouseButtonDown(0)
      .moveToElement('canvas', 151, 40)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[3,"abcdefg"],[3,"椭圆形"]]')

      .end();
  }
};
