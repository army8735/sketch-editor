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
      .moveToElement('#main .geometry .interactive', 50, 100)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .interactive', 50, 50)
      .mouseButtonUp(0)
      .assert.attributeEquals('#tree dl[uuid="44100BDF-FC54-4F8D-B0F5-FF1BC4752E75"] svg path', 'd', 'M0,0L12,0L12,10.909090909090908L5.454545454545455,5.454545454545455L0,10.909090909090908L0,0Z')
      .assert.attributeEquals('#tree dl[uuid="E82E2F00-605F-49E6-A08B-C61BF8C4FF85"] svg path', 'd', 'M0,0L12,0L12,10.928571428571423L0,10.928571428571423L0,0Z')

      .end();
  }
};
