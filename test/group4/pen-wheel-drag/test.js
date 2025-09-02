const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .keys('p')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 100, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 200, 200)
      .keys(browser.Keys.SPACE)
      .assert.not.cssClassPresent('#main .canvas-c', 'add-pen')
      .pause(20)
      .mouseButtonDown(0)
      .moveToElement('canvas', 190, 190)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 210, 210)
      .assert.cssClassPresent('#main .canvas-c', 'add-pen')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":50,"absY":0,"absTx":50,"absTy":0,"absFx":50,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":50,"absY":50,"absTx":50,"absTy":50,"absFx":50,"absFy":50}]]')
      .click('#button2')
      .assert.value('#base64', '')

      .end();
  }
};
