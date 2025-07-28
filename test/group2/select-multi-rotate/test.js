const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 250, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('a')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .select.multi .sub div[title="0"]', 'display', 'block')
      .assert.cssProperty('#main .select.multi .sub div[title="0"]', 'left', '0px')
      .assert.cssProperty('#main .select.multi .sub div[title="0"]', 'top', '0px')
      .assert.cssProperty('#main .select.multi .sub div[title="0"]', 'width', '100px')
      .assert.cssProperty('#main .select.multi .sub div[title="0"]', 'height', '100px')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'display', 'block')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'left', '200px')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'top', '129.289')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'width', '100px')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'height', '100px')
      .assert.cssProperty('#main .select.multi .sub div[title="1"]', 'transform', 'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)')

      .end();
  }
};
