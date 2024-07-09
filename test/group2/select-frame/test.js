const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 40, 40)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0,"1"]')

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 150)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[1,"1"],[1,"2"]]')

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 280, 280)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[2,"1"],[2,"2"],[2,"编组"],[2,"形状结合"]]')

      .keys(browser.Keys.META)

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 320, 320)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[3,"画板"]')

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 280, 280)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[4,"1"],[4,"2"],[4,"3"],[4,"4"],[4,"形状结合"]]')

      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 320, 320)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[5,"1"],[5,"2"],[5,"3"],[5,"4"],[5,"形状结合"]]')

      .keys(browser.Keys.NULL)
      .end();
  }
};
