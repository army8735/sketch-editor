const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('#tree .name[title="1"]', 5, 5)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .moveToElement('.sketch-editor-context-menu .item.prev', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '')
      .assert.elementPresent('#tree dl[uuid="A54F2CDE-531F-4A9C-9E6F-45FDC0003865"] .mask')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '')
      .assert.not.elementPresent('#tree dl[uuid="A54F2CDE-531F-4A9C-9E6F-45FDC0003865"] .mask')

      .end();
  }
};
