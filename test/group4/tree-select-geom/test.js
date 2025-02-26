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
      .moveToElement('canvas', 50, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'display', 'block')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .click('#button4')
      .assert.value('#base64', '[1,"1"]')

      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .click('#tree span.name[title="2"]')
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .assert.cssProperty('#main .geometry .item', 'top', '120px')
      .click('#button4')
      .assert.value('#base64', '[2,"2"]')

      .moveToElement('#tree', 50, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'display', 'block')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .click('#button4')
      .assert.value('#base64', '[3]')
      .moveToElement('#tree', 50, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .click('#button4')
      .assert.value('#base64', '[4]')

      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .moveToElement('#main', 400, 400)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'display', 'block')
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssProperty('#main .select', 'display', 'none')
      .assert.cssProperty('#main .geometry', 'display', 'none')

      .end();
  }
};
