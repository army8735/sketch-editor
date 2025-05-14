const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.elementPresent('#toolbar .sel.item.active')
      .click('#toolbar .geom')
      .assert.elementPresent('#toolbar .geom.item.active')
      .assert.not.elementPresent('#toolbar .sel.item.active')

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0]')

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 100, 100)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[1,]')
      .click('#button4')
      .assert.value('#base64', '[2,"矩形"]')
      .click('#button7')
      .assert.value('#base64', '[3]')
      .assert.elementPresent('#tree .name[title="矩形"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[4]')
      .assert.not.elementPresent('#tree .name[title="矩形"]')
      .assert.cssClassPresent('#toolbar .sel', ['sel', 'item', 'active'])
      .assert.cssClassPresent('#toolbar .geom', ['geom', 'item'])

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[5,]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 50, 250)
      .keys(browser.Keys.META)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#toolbar .geom')
      .moveToElement('canvas', 200, 250)
      .mouseButtonDown(0)
      .moveToElement('canvas', 250, 300)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[6,]')
      .click('#button7')
      .assert.value('#base64', '[7]')

      .end();
  }
};
