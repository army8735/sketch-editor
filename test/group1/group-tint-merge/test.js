const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.value('input', '')
      .moveToElement('canvas', 10, 10)
      .mouseButtonClick(0)
      .pause(20)
      .assert.value('input', '')
      .end();
  }
};
