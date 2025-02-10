const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .keys(browser.Keys.DELETE)
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .geometry', 'display', 'none')
      .click('#button6')
      .assert.value('#base64', '[2,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .keys(browser.Keys.DELETE)
      .keys(browser.Keys.NULL)
      .assert.cssProperty('#main .geometry', 'display', 'none')

      .end();
  }
};
