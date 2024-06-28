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
      .click('#button2')
      .assert.value('#base64', '[0,{"v":25,"u":2},{"v":0,"u":0},{"v":25,"u":2},{"v":0,"u":0},{"v":100,"u":1},{"v":100,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},50,50,50,50,100,100,-50,-50]')
      .moveToElement('.side .text-panel .auto', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[1,{"v":13.0107421875,"u":2},{"v":0,"u":0},{"v":6.8994140625,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},26.021484375,121.935546875,13.798828125,158.603515625,52.04296875,27.59765625,-26.021484375,-13.798828125]')
      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[2,{"v":25,"u":2},{"v":0,"u":0},{"v":25,"u":2},{"v":0,"u":0},{"v":100,"u":1},{"v":100,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},50,50,50,50,100,100,-50,-50]')
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.value('#base64', '[3,{"v":13.0107421875,"u":2},{"v":0,"u":0},{"v":6.8994140625,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},26.021484375,121.935546875,13.798828125,158.603515625,52.04296875,27.59765625,-26.021484375,-13.798828125]')
      .end();
  }
};
