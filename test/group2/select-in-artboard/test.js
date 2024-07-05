const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0,"编组 3"]')
      .assert.cssProperty('#main div.select', 'display', 'block')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .moveToElement('canvas', 20, 120)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[1]')
      .assert.not.elementPresent('#main div.select')

      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[2,"编组 3"]')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[3,"1"]')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .moveToElement('canvas', 20, 120)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[4,"画板"]')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .moveToElement('canvas', 120, 120)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[5,"3"]')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[6,"形状结合"]')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)

      .moveToElement('canvas', 260, 260)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[7,"画板"]')

      .end();
  }
};
