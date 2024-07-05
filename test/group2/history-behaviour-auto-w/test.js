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
      .assert.value('#base64', '[0,{"v":13.25,"u":2},{"v":0,"u":0},{"v":7.25,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},26.5,121.45703125,14.5,157.90234375,52.04296875,27.59765625,-26.021484375,-13.798828125]')
      .moveToElement('.main .select .r', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.main .select .r', -11, 1)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[1,{"v":10.25,"u":2},{"v":0,"u":0},{"v":14.1494140625,"u":2},{"v":0,"u":0},{"v":40.04296875,"u":1},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},20.5,139.45703125,28.298828125,116.505859375,40.04296875,55.1953125,-20.021484375,-27.59765625]')
      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[2,{"v":13.25,"u":2},{"v":0,"u":0},{"v":7.25,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},26.5,121.45703125,14.5,157.90234375,52.04296875,27.59765625,-26.021484375,-13.798828125]')
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[3,{"v":10.25,"u":2},{"v":0,"u":0},{"v":14.1494140625,"u":2},{"v":0,"u":0},{"v":40.04296875,"u":1},{"v":0,"u":0},{"v":-50,"u":2},{"v":-50,"u":2},20.5,139.45703125,28.298828125,116.505859375,40.04296875,55.1953125,-20.021484375,-27.59765625]')
      .end();
  }
};
