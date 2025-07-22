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
      .moveToElement('canvas', 50, 50)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0,"f"]')

      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .moveToElement('canvas', 140, 140)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[1,"f"]')

      .moveToElement('canvas', 170, 20)
      .mouseButtonDown(0)
      .moveToElement('canvas', 190, 40)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[2]')

      .moveToElement('canvas', 170, 20)
      .mouseButtonDown(0)
      .moveToElement('canvas', 220, 70)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[3,"r"]')

      .moveToElement('canvas', 170, 20)
      .mouseButtonDown(0)
      .moveToElement('canvas', 300, 140)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[4,"f2"]')

      .moveToElement('canvas', 20, 160)
      .mouseButtonDown(0)
      .moveToElement('canvas', 40, 180)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[5]')

      .moveToElement('canvas', 20, 160)
      .mouseButtonDown(0)
      .moveToElement('canvas', 70, 210)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[6,"f4"]')

      .moveToElement('canvas', 20, 160)
      .mouseButtonDown(0)
      .moveToElement('canvas', 140, 280)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[7,"f3"]')

      .end();
  }
};
