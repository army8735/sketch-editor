const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.not.elementPresent('.sketch-editor-picker')
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('#side .stroke-panel .line[title="0"] .pick')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('.sketch-editor-picker')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')
      .assert.cssClassPresent('.sketch-editor-picker', ['sketch-editor-picker', 'strokePanel0'])
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('.sketch-editor-picker')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'none')
      .assert.cssClassPresent('.sketch-editor-picker', ['sketch-editor-picker', 'strokePanel0'])

      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('.sketch-editor-picker')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')
      .assert.cssClassPresent('.sketch-editor-picker', ['sketch-editor-picker', 'strokePanel0'])
      .moveToElement('#side .stroke-panel .line[title="1"] .pick')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('.sketch-editor-picker')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')
      .assert.cssClassPresent('.sketch-editor-picker', ['sketch-editor-picker', 'strokePanel1'])

      .moveToElement('#side .fill-panel .line[title="0"] .pick')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('.sketch-editor-picker')
      .assert.cssProperty('.sketch-editor-picker', 'display', 'block')
      .assert.cssClassPresent('.sketch-editor-picker', ['sketch-editor-picker', 'fillPanel0'])
      .assert.cssProperty('#main .canvas-c .gradient', 'display', 'none')
      .assert.cssClassPresent('#side .fill-panel .line[title="0"] .hex', ['hex'])

      .click('.sketch-editor-picker .type .linear')
      .assert.cssClassPresent('#side .fill-panel .line[title="0"] .gradient', ['gradient'])
      .assert.cssClassPresent('#side .fill-panel .line[title="0"] .hex', ['hex', 'hide'])

      .end();
  }
};
