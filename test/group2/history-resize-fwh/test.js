const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0,{"v":27.5,"u":2},{"v":0,"u":0},{"v":27.5,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},110,90,110,90,200,200,-100,-100]')

      .moveToElement('.br', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.br', 21, 11)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[1,{"v":30,"u":2},{"v":0,"u":0},{"v":28.75,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":210,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},120,60,115,75,220,210,-110,-105]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[2,{"v":27.5,"u":2},{"v":0,"u":0},{"v":27.5,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},110,90,110,90,200,200,-100,-100]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[3,{"v":30,"u":2},{"v":0,"u":0},{"v":28.75,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":210,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},120,60,115,75,220,210,-110,-105]')

      .moveToElement('.tl', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.tl', 21, 11)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[4,{"v":32.5,"u":2},{"v":0,"u":0},{"v":30,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},130,70,120,80,200,200,-100,-100]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[5,{"v":30,"u":2},{"v":0,"u":0},{"v":28.75,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":210,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},120,60,115,75,220,210,-110,-105]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[6,{"v":32.5,"u":2},{"v":0,"u":0},{"v":30,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},130,70,120,80,200,200,-100,-100]')

      .moveToElement('.tr', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.tr', 21, 11)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[7,{"v":35,"u":2},{"v":0,"u":0},{"v":31.25,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":190,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},140,40,125,85,220,190,-110,-95]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[8,{"v":32.5,"u":2},{"v":0,"u":0},{"v":30,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},130,70,120,80,200,200,-100,-100]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[9,{"v":35,"u":2},{"v":0,"u":0},{"v":31.25,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":190,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},140,40,125,85,220,190,-110,-95]')

      .moveToElement('.bl', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.bl', 21, 11)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[10,{"v":37.5,"u":2},{"v":0,"u":0},{"v":32.5,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},150,50,130,70,200,200,-100,-100]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[11,{"v":35,"u":2},{"v":0,"u":0},{"v":31.25,"u":2},{"v":0,"u":0},{"v":220,"u":1},{"v":190,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},140,40,125,85,220,190,-110,-95]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[12,{"v":37.5,"u":2},{"v":0,"u":0},{"v":32.5,"u":2},{"v":0,"u":0},{"v":200,"u":1},{"v":200,"u":1},{"v":-50,"u":2},{"v":-50,"u":2},150,50,130,70,200,200,-100,-100]')

      .end();
  }
};
