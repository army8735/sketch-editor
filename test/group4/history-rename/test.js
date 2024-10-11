const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('#tree dt .name', 20, 20)
      .doubleClick()
      .assert.elementPresent('#tree dt input')
      .keys('1')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.containsText('#tree dt .name', '矩形1')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.containsText('#tree dt .name', '矩形')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .assert.containsText('#tree dt .name', '矩形1')

      .end();
  }
};
