const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(1)
      .mouseButtonUp(1)
      .assert.value('#base64', '0,')
      .mouseButtonDown(2)
      .mouseButtonUp(2)
      .assert.value('#base64', '[1,{"v":17.523650811823877,"u":2},{"v":16.137465175743248,"u":2},{"v":0,"u":2},{"v":0,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},176.98286937901443,162.98286937901503,0,0,670,818,0,0]')
      .assert.value('#side .basic-panel .x', '70')
      .assert.value('#side .basic-panel .y', '-105')
      .assert.value('#side .basic-panel .r', '0')
      .assert.value('#side .basic-panel .w', '670')
      .assert.value('#side .basic-panel .h', '818')
      .assert.value('#side .basic-panel .h', '818')
      .end();
  }
};
