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
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":10,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.888888888888889,"y":0,"cornerRadius":20,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.888888888888889,"fy":0,"tx":0.888888888888889,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":0.888888888888889,"y":0.888888888888889,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.666666666666667,"fy":1.11111111111111,"tx":1.11111111111111,"ty":0.666666666666667,"absX":150,"absY":100,"absTx":187.49999999999983,"absTy":75.00000000000003,"absFx":112.50000000000006,"absFy":124.99999999999989},{"x":0,"y":0.888888888888889,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.888888888888889,"tx":0,"ty":0.888888888888889,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')
      // .assert.domPropertyEquals('#side .point-panel .num input[type="range"]', 'disabled', 'true')
      // .assert.domPropertyEquals('#side .point-panel .num input[type="number"]', 'disabled', 'true')

      .click('#main .geometry .vt[title="0"]')
      // .assert.domPropertyEquals('#side .point-panel .num input[type="range"]', 'disabled', 'false')
      // .assert.domPropertyEquals('#side .point-panel .num input[type="number"]', 'disabled', 'false')
      .updateValue('#side .point-panel .num input[type="number"]', ['0', browser.Keys.ENTER])
      .assert.value('#base64', '[1,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.888888888888889,"y":0,"cornerRadius":20,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.888888888888889,"fy":0,"tx":0.888888888888889,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":0.888888888888889,"y":0.888888888888889,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.666666666666667,"fy":1.11111111111111,"tx":1.11111111111111,"ty":0.666666666666667,"absX":150,"absY":100,"absTx":187.49999999999983,"absTy":75.00000000000003,"absFx":112.50000000000006,"absFy":124.99999999999989},{"x":0,"y":0.888888888888889,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.888888888888889,"tx":0,"ty":0.888888888888889,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":10,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.8888888888888895,"y":0,"cornerRadius":20,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.8888888888888895,"fy":0,"tx":0.8888888888888895,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":0.8888888888888895,"y":0.8888888888888893,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6666666666666674,"fy":1.1111111111111107,"tx":1.111111111111111,"ty":0.6666666666666673,"absX":150,"absY":100,"absTx":187.49999999999986,"absTy":75.00000000000003,"absFx":112.50000000000004,"absFy":124.99999999999989},{"x":0,"y":0.8888888888888893,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.8888888888888893,"tx":0,"ty":0.8888888888888893,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .end();
  }
};
