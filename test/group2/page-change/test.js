const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .click('#button1')
      .assert.value('input', '')
      .assert.domPropertyEquals('#page li.active', 'title', '页面 1')
      .click('#page li[title="页面 2"]')
      .pause(20)
      .click('#button1')
      .assert.value('input', '')
      .assert.domPropertyEquals('#page li.active', 'title', '页面 2')
      .end();
  }
};
