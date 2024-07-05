const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[0,"1"]')
      .assert.domPropertyEquals('#tree dt.active .name', 'title', '1')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 70, 70)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '2')

      .moveToElement('canvas', 120, 120)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '3')

      .moveToElement('canvas', 170, 170)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '编组 4')

      .keys(browser.Keys.META)
      .moveToElement('canvas', 220, 120)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[1,"矩形"]')
      .assert.domPropertyEquals('#tree dt.active .name', 'title', '矩形')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 70, 70)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '编组 2')

      .moveToElement('canvas', 170, 170)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '形状结合')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[2,"矩形"],[2,"1"]]')

      .moveToElement('canvas', 70, 70)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '2')

      .moveToElement('canvas', 120, 120)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '3')

      .moveToElement('canvas', 170, 170)
      .assert.domPropertyEquals('#tree dt.hover .name', 'title', '形状结合')

      .end();
  }
};
