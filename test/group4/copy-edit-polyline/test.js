const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .moveToElement('canvas', 10, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 50)
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100},{"x":0.1,"y":0.4,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.1,"fy":0.4,"tx":0.1,"ty":0.4,"absX":10,"absY":40,"absTx":10,"absTy":40,"absFx":10,"absFy":40}]]')

      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('c')
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .moveToElement('canvas', 150, 150)
      .mouseButtonUp(0)
      .keys(browser.Keys.META)
      .keys('v')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .select', 'left', '10px')
      .assert.cssProperty('#main .select', 'top', '10px')
      // 老的不再选择
      .assert.not.cssClassPresent('dl[uuid="EEB43720-A2E0-444C-9E29-37489788E994"] dt', 'active')
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100},{"x":0.1,"y":0.4,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.1,"fy":0.4,"tx":0.1,"ty":0.4,"absX":10,"absY":40,"absTx":10,"absTy":40,"absFx":10,"absFy":40}]]')

      .end();
  }
};
