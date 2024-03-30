const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.value('input', '')
      .moveToElement('canvas', 1, 1)
      .mouseButtonClick(0)
      .assert.value('input', '{"left":20,"top":20,"right":494,"bottom":448,"points":[{"x":20,"y":20},{"x":494,"y":20},{"x":494,"y":448},{"x":20,"y":448}]}')
      .end();
  }
};
