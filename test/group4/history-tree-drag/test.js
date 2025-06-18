const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.cssClassPresent('dl[uuid="455286D1-26FC-4EB2-9254-881818B57F33"]', 'layer')
      .assert.not.cssClassPresent('dl[uuid="455286D1-26FC-4EB2-9254-881818B57F33"]', 'expand')
      .click('#button7')
      .assert.value('#base64', '[0,{"name":"ab","children":[{"name":"123","children":[]},{"name":"456","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .moveToElement('span[title="123"]', 5, 5)
      .mouseButtonDown(0)
      .moveToElement('span[title="编组1"]', 5, 12)
      .assert.cssClassPresent('dl[uuid="186BCC6D-187A-4F71-86C5-298DE5716499"]', 'drag')
      .assert.cssClassPresent('dl[uuid="455286D1-26FC-4EB2-9254-881818B57F33"]', 'expand')
      .assert.cssProperty('#tree .position', 'display', 'none')
      .moveToElement('span[title="456"]', 5, 1)
      .assert.cssClassPresent('dl[uuid="00AB0119-72C7-4E33-BAB6-16DF3CE869F2"]', 'active')
      .assert.cssProperty('#tree .position', 'display', 'block')
      .mouseButtonUp(0)
      .assert.not.cssClassPresent('dl[uuid="186BCC6D-187A-4F71-86C5-298DE5716499"]', 'drag')
      .assert.not.cssClassPresent('dl[uuid="00AB0119-72C7-4E33-BAB6-16DF3CE869F2"]', 'active')
      .click('#button7')
      .assert.value('#base64', '[1,{"name":"ab","children":[{"name":"123","children":[]},{"name":"456","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .moveToElement('span[title="123"]', 5, 5)
      .mouseButtonDown(0)
      .moveToElement('span[title="456"]', 5, 20)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[2,{"name":"ab","children":[{"name":"456","children":[]},{"name":"123","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button7')
      .assert.value('#base64', '[3,{"name":"ab","children":[{"name":"123","children":[]},{"name":"456","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .moveToElement('span[title="456"]', 5, 5)
      .mouseButtonDown(0)
      .moveToElement('span[title="123"]', 5, 20)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[4,{"name":"ab","children":[{"name":"123","children":[]},{"name":"456","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .moveToElement('span[title="456"]', 5, 5)
      .mouseButtonDown(0)
      .moveToElement('span[title="123"]', 5, 5)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[5,{"name":"ab","children":[{"name":"456","children":[]},{"name":"123","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button7')
      .assert.value('#base64', '[6,{"name":"ab","children":[{"name":"456","children":[]},{"name":"123","children":[]},{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .moveToElement('span[title="123"]', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .moveToElement('span[title="123"]', 5, 5)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .mouseButtonDown(0)
      .moveToElement('span[title="编组1"]', 5, 12)
      .mouseButtonUp(0)
      .click('#button7')
      .assert.value('#base64', '[7,{"name":"ab","children":[{"name":"abc","children":[]},{"name":"编组2","children":[{"name":"三角形","children":[]},{"name":"编组1","children":[{"name":"123","children":[]},{"name":"456","children":[]},{"name":"椭圆形","children":[]},{"name":"矩形","children":[]}]}]}]}]')

      .end();
  }
};
