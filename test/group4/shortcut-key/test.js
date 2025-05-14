const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.elementPresent('#toolbar .sel.item.active')
      .assert.elementPresent('#toolbar .sel.item .ti[title="select"]')
      .assert.elementPresent('#toolbar .sel.item .ti[title="select"] .select')

      .keys('h')
      .assert.elementPresent('#toolbar .sel.item.active')
      .assert.not.elementPresent('#toolbar .sel.item .ti[title="select"]')
      .assert.not.elementPresent('#toolbar .sel.item .ti[title="select"] .select')
      .assert.elementPresent('#toolbar .sel.item .ti[title="hand"]')
      .assert.elementPresent('#toolbar .sel.item .ti[title="hand"] .hand')
      .assert.elementPresent('#toolbar .sel.item .sub .cur[title="select"]')
      .assert.not.elementPresent('#toolbar .sel.item .sub .cur[title="hand"]')

      .keys('v')
      .assert.elementPresent('#toolbar .sel.item.active')
      .assert.elementPresent('#toolbar .sel.item .ti[title="select"]')
      .assert.elementPresent('#toolbar .sel.item .ti[title="select"] .select')
      .assert.not.elementPresent('#toolbar .sel.item .ti[title="hand"]')
      .assert.not.elementPresent('#toolbar .sel.item .ti[title="hand"] .hand')
      .assert.not.elementPresent('#toolbar .sel.item .sub .cur[title="select"]')
      .assert.elementPresent('#toolbar .sel.item .sub .cur[title="hand"]')

      .keys('r')
      .assert.not.elementPresent('#toolbar .sel.item.active')
      .assert.elementPresent('#toolbar .geom.item.active')
      .assert.elementPresent('#toolbar .geom.item .ti[title="rect"]')
      .assert.elementPresent('#toolbar .geom.item .ti[title="rect"] .rect')
      .assert.elementPresent('#toolbar .geom.item .sub .cur[title="rect"]')

      .keys('o')
      .assert.elementPresent('#toolbar .geom.item.active')
      .assert.elementPresent('#toolbar .geom.item .ti[title="oval"]')
      .assert.elementPresent('#toolbar .geom.item .ti[title="oval"] .oval')
      .assert.elementPresent('#toolbar .geom.item .sub .cur[title="oval"]')

      .keys('u')
      .assert.elementPresent('#toolbar .geom.item.active')
      .assert.elementPresent('#toolbar .geom.item .ti[title="round"]')
      .assert.elementPresent('#toolbar .geom.item .ti[title="round"] .round')
      .assert.elementPresent('#toolbar .geom.item .sub .cur[title="round"]')

      .keys('t')
      .assert.elementPresent('#toolbar .text.item.active')
      .assert.not.elementPresent('#toolbar .geom.item.active')
      .assert.not.elementPresent('#toolbar .geom.item .sub .cur')

      .end();
  }
};
