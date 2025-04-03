const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.elementPresent('#tree .name[title="abcd"]')
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.BACK_SPACE)
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#tree .name[title="abcd"]')
      .assert.elementPresent('#tree .name[title="abc"]')

      .moveToElement('#tree .name[title="abc"]', 50, 20)
      .doubleClick()
      .keys('z')
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ENTER)
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#tree .name[title="abc"]')
      .assert.elementPresent('#tree .name[title="abcz"]')

      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.BACK_SPACE)
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#tree .name[title="ab"]')
      .assert.elementPresent('#tree .name[title="abcz"]')

      .end();
  }
};
