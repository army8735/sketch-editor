const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 31, 31)
      .assert.value('#base64', '0, hover: 1')

      .moveToElement('canvas', 31, 41)
      .assert.value('#base64', '0, hover: 1')

      .moveToElement('canvas', 11, 11)
      .assert.value('#base64', '1, unHover')

      .moveToElement('canvas', 31, 261)
      .assert.value('#base64', '2, hover: 编组')

      .moveToElement('canvas', 41, 261)
      .assert.value('#base64', '2, hover: 编组')

      .moveToElement('canvas', 11, 11)
      .assert.value('#base64', '3, unHover')

      .moveToElement('canvas', 201, 31)
      .assert.value('#base64', '4, hover: 形状结合')

      .moveToElement('canvas', 211, 31)
      .assert.value('#base64', '4, hover: 形状结合')

      .end();
  }
};
