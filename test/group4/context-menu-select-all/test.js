const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0,"矩形"]')

      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .click('#button4')
      .assert.value('#base64', '[1]')

      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.elementPresent('.sketch-editor-context-menu')
      .moveToElement('.sketch-editor-context-menu .select-all', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[2,"矩形"]')

      .end();
  }
};
