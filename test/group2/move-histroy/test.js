const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveTo(null, 100, 100)
      .mouseButtonDown(0)
      .moveTo(null, 120, 110)
      .mouseButtonUp(0)
      .execute(() => {
        const style = window.root.getCurPage().children[0].style;
        const input = document.querySelector('input');
        input.value = JSON.stringify([style.left, style.right, style.top, style.bottom]);
      }, [], () => {
        browser
          .assert.value('input', '')
          .end();
      })
  }
};
