const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.attributeEquals('#tree dl[uuid="44100BDF-FC54-4F8D-B0F5-FF1BC4752E75"] svg path', 'd', 'M0,0L12,0L12,12L0,12L0,0Z')

      .moveToElement('#tree span[title="3"]', 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#side .basic-panel .w')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.attributeEquals('#tree dl[uuid="44100BDF-FC54-4F8D-B0F5-FF1BC4752E75"] svg path', 'd', 'M0,0L12,0L12,10.909090909090908L0,10.909090909090908L0,0Z')
      .assert.attributeEquals('#tree dl[uuid="E82E2F00-605F-49E6-A08B-C61BF8C4FF85"] svg path', 'd', 'M0,6L0,0L6.6,0L6.6,6L11.999999999999998,6L11.999999999999998,11.999999999999998L6,11.999999999999998L6,6L0,6Z')


      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .moveToElement('#main .geometry .item .vt[title="2"]', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .item .vt[title="2"]', -10, -10)
      .mouseButtonUp(0)
      .assert.attributeEquals('#tree dl[uuid="44100BDF-FC54-4F8D-B0F5-FF1BC4752E75"] svg path', 'd', 'M0,0L12,0L10.909090909090908,9.818181818181818L0,10.909090909090908L0,0Z')
      .assert.attributeEquals('#tree dl[uuid="E82E2F00-605F-49E6-A08B-C61BF8C4FF85"] svg path', 'd', 'M6,11.999999999999998L6,6L11.999999999999998,6L11.999999999999998,11.999999999999998L6,11.999999999999998ZM0,6L6,5.4L6.6,0L0,0L0,6Z')

      .end();
  }
};
