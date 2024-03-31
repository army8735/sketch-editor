const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveTo('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveTo('canvas', 30, 20)
      .mouseButtonUp(0)
      .execute(() => {
        const node = window.root.getCurPage().children[0];
        const style = node.style;
        const input = document.querySelector('input');
        input.value = JSON.stringify([node.getBoundingClientRect(), style.left, style.right, style.top, style.bottom]);
      }, [], () => {
        browser
          .assert.value('input', '[{"v":10,"u":2},{"v":-110,"u":2},{"v":10,"u":2},{"v":-110,"u":2}]')
          .end();
      })
  }
};
