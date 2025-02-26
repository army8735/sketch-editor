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

      .keys(browser.Keys.META)
      .click('#tree span.name[title="2"]')
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[1,"1"],[1,"2"]]')
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .assert.cssProperty('#main .geometry .item[idx="0"]', 'display', 'block')
      .assert.cssProperty('#main .geometry .item[idx="0"]', 'top', '10px')
      .assert.cssProperty('#main .geometry .item[idx="1"]', 'display', 'block')
      .assert.cssProperty('#main .geometry .item[idx="1"]', 'top', '120px')

      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select.multi', 'display', 'block')
      .assert.cssProperty('#main .select.multi', 'top', '10px')
      .assert.cssProperty('#main .select.multi', 'height', '210px')
      .assert.cssProperty('#main .geometry', 'display', 'none')

      .end();
  }
};
