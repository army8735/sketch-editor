const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('#tree .name[title="2"]', 5, 5)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.elementPresent('.sketch-editor-context-menu')
      .assert.cssClassPresent('.sketch-editor-context-menu', 'only-tree')
      .assert.cssClassPresent('.sketch-editor-context-menu', 'no-next')

      .moveToElement('.sketch-editor-context-menu .item.prev', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[0,{"name":"1","children":[]},{"name":"2","children":[]}]')

      .moveToElement('#tree .name[title="2"]', 5, 5)
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.elementPresent('.sketch-editor-context-menu')
      .assert.cssClassPresent('.sketch-editor-context-menu', 'only-tree')
      .assert.cssClassPresent('.sketch-editor-context-menu', 'no-prev')

      .moveToElement('.sketch-editor-context-menu .item.next', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[1,{"name":"2","children":[]},{"name":"1","children":[]}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button7')
      .assert.value('#base64', '[2,{"name":"1","children":[]},{"name":"2","children":[]}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button7')
      .assert.value('#base64', '[3,{"name":"2","children":[]},{"name":"1","children":[]}]')

      .end();
  }
};
