const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveTo(null, 100, 100)
      .pause(20)
      .mouseButtonDown(0)
      .pause(20)
      .moveTo(null, 120, 110)
      .pause(20)
      .mouseButtonUp(0)
      .pause(20)
      .execute(() => {
        const style = window.root.getCurPage().children[0].style;
        const input = document.querySelector('input');
        input.value = JSON.stringify([style.left, style.right, style.top, style.bottom]);
      }, [], () => {
        browser
          .assert.value('input', '[{"v":10,"u":2},{"v":-110,"u":2},{"v":10,"u":2},{"v":-110,"u":2}]')
          .end();
      })
  }
};
