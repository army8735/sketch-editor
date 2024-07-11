const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0,{"v":70,"u":2},{"v":-640,"u":2},{"v":-105,"u":2},{"v":-613,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},70,-640,-105,-613,670,818,0,0]')
      .assert.value('#side .basic-panel .x input', '70')
      .assert.value('#side .basic-panel .y input', '-105')
      .assert.value('#side .basic-panel .r input', '0')
      .assert.value('#side .basic-panel .w input', '670')
      .assert.value('#side .basic-panel .h input', '818')
      .end();
  }
};
