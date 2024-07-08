const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 31, 31)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '1')

      .moveToElement('canvas', 31, 221)
      .assert.not.elementPresent('#tree dt.hover')

      .moveToElement('canvas', 31, 261)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '编组')

      .moveToElement('canvas', 131, 131)
      .assert.not.elementPresent('#tree dt.hover')

      .moveToElement('canvas', 151, 151)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '2')

      .moveToElement('canvas', 201, 31)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '形状结合')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 31, 261)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '3')

      .moveToElement('canvas', 201, 31)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '形状结合')

      .keys(browser.Keys.NULL)
      .end();
  }
};
