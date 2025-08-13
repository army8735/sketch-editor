const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 60, 110)
      .mouseButtonDown(0)
      .moveToElement('canvas', 70, 120)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[0,"5"]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 60, 110)
      .mouseButtonDown(0)
      .moveToElement('canvas', 140, 120)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[1,"5"]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 60, 110)
      .mouseButtonDown(0)
      .moveToElement('canvas', 140, 210)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[2,"3"],[2,"5"]]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 210, 30)
      .mouseButtonDown(0)
      .moveToElement('canvas', 260, 150)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[3,"4"]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .keys(browser.Keys.META)
      .moveToElement('canvas', 210, 30)
      .mouseButtonDown(0)
      .moveToElement('canvas', 260, 210)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .click('#button4')
      .assert.value('#base64', '[[4,"1"],[4,"3"],[4,"4"]]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)

      .end();
  }
};
