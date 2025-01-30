const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.842105263157894,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473686,"fy":0.3333333333333333,"tx":0.6315789473684202,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000026,"absFy":43.75},{"x":0.842105263157894,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684202,"fy":1.0952380952380953,"tx":1.0526315789473686,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000026,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .click('#main .geometry .vt[title="1"]')
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="1"] span.t', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .vt[title="1"] span.t', 1, 1)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.842105263157894,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473686,"fy":0.3333333333333333,"tx":0.6315789473684202,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000026,"absFy":43.75},{"x":0.842105263157894,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684202,"fy":1.0952380952380953,"tx":1.0526315789473686,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000026,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .click('#main .geometry .vt[title="2"]')
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="2"] span.t', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .vt[title="2"] span.t', 1, 1)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.842105263157894,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473686,"fy":0.3333333333333333,"tx":0.6315789473684202,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000026,"absFy":43.75},{"x":0.842105263157894,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684202,"fy":1.0952380952380953,"tx":1.0526315789473686,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000026,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[5,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.8888888888888883,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1.1111111111111116,"fy":0.3,"tx":0.666666666666666,"ty":-0.1,"absX":150.00000000000006,"absY":0,"absTx":112.5,"absTy":-12.5,"absFx":187.50000000000028,"absFy":37.5},{"x":0.8888888888888883,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.666666666666666,"fy":1.1,"tx":1.1111111111111116,"ty":0.7,"absX":150.00000000000006,"absY":112.5,"absTx":187.50000000000028,"absTy":87.5,"absFx":112.5,"absFy":137.5},{"x":0,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9,"tx":0,"ty":0.9,"absX":0,"absY":112.5,"absTx":0,"absTy":112.5,"absFx":0,"absFy":112.5}]]')

      .end();
  }
};
