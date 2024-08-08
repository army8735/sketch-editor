const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 20, 20)
      .assert.not.elementPresent('#tree .hover')

      .moveToElement('canvas', 20, 140)
      .assert.not.elementPresent('#tree .hover')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 30, 140)
      .assert.not.elementPresent('#tree .hover')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 140, 20)
      .assert.elementPresent('#tree .hover')

      .moveToElement('canvas', 50, 280)
      .assert.elementPresent('#tree .hover')
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '5')

      .end();
  }
};
