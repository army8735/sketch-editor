const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .click('#button4')
      .assert.value('#base64', '[0,"1"]')
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'block')

      .click('#tree span.name[title="abc"]')
      .assert.cssProperty('#main .select', 'display', 'block')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .click('#button4')
      .assert.value('#base64', '[1,"abc"]')

      .moveToElement('canvas', 50, 150)
      .doubleClick()
      .assert.cssProperty('#main div.input', 'opacity', '1')
      .click('#tree span.name[title="1"]')
      .assert.cssProperty('#main div.input', 'opacity', '0')
      .assert.cssProperty('#main .select', 'display', 'block')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .assert.cssProperty('#main div.select', 'top', '10px')
      .click('#button4')
      .assert.value('#base64', '[2,"1"]')

      .end();
  }
};
