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
      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="1"] span.t', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .vt[title="1"] span.t', 1, 1)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.04397705544933078,"tx":0,"ty":0.04397705544933078,"absX":0,"absY":5.75,"absTx":0,"absTy":5.75,"absFx":0,"absFy":5.75},{"x":0.8438758424648896,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0492189641313463,"fy":0.13193116634799235,"tx":0.6385327207984328,"ty":-0.04397705544933078,"absX":150.00000000000006,"absY":5.75,"absTx":113.5,"absTy":-5.75,"absFx":186.5000000000001,"absFy":17.25},{"x":0.8438758424648896,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.632906881848667,"fy":1.095602294455067,"tx":1.054844803081113,"ty":0.7131931166347992,"absX":150.00000000000006,"absY":118.25,"absTx":187.50000000000028,"absTy":93.25,"absFx":112.5,"absFy":143.25},{"x":0,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.904397705544933,"tx":0,"ty":0.904397705544933,"absX":0,"absY":118.25,"absTx":0,"absTy":118.25,"absFx":0,"absFy":118.25}]]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="2"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="2"] span.t', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .vt[title="2"] span.t', 1, 1)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[2,[{"x":0,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.04397705544933078,"tx":0,"ty":0.04397705544933078,"absX":0,"absY":5.75,"absTx":0,"absTy":5.75,"absFx":0,"absFy":5.75},{"x":0.8420816341763745,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0469881651592925,"fy":0.13193116634799235,"tx":0.6371751031934564,"ty":-0.04397705544933078,"absX":150.00000000000006,"absY":5.75,"absTx":113.5,"absTy":-5.75,"absFx":186.5000000000001,"absFy":17.25},{"x":0.8420816341763745,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315612256322806,"fy":1.095602294455067,"tx":1.0582159202816452,"ty":0.7208413001912046,"absX":150.00000000000006,"absY":118.25,"absTx":188.5000000000003,"absTy":94.25,"absFx":112.5,"absFy":143.25},{"x":0,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.904397705544933,"tx":0,"ty":0.904397705544933,"absX":0,"absY":118.25,"absTx":0,"absTy":118.25,"absFx":0,"absFy":118.25}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.04397705544933078,"tx":0,"ty":0.04397705544933078,"absX":0,"absY":5.75,"absTx":0,"absTy":5.75,"absFx":0,"absFy":5.75},{"x":0.8438758424648892,"y":0.04397705544933078,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0492189641313459,"fy":0.13193116634799235,"tx":0.6385327207984327,"ty":-0.04397705544933078,"absX":150.00000000000006,"absY":5.75,"absTx":113.50000000000001,"absTy":-5.75,"absFx":186.5000000000001,"absFy":17.25},{"x":0.8438758424648892,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6329068818486668,"fy":1.095602294455067,"tx":1.0548448030811128,"ty":0.7131931166347992,"absX":150.00000000000006,"absY":118.25,"absTx":187.50000000000028,"absTy":93.25,"absFx":112.50000000000003,"absFy":143.25},{"x":0,"y":0.904397705544933,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.904397705544933,"tx":0,"ty":0.904397705544933,"absX":0,"absY":118.25,"absTx":0,"absTy":118.25,"absFx":0,"absFy":118.25}]]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="2"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#side .point-panel .type .asymmetric')
      .moveToElement('#main .geometry .vt[title="2"] span.t', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .vt[title="2"] span.t', 1, 1)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[4,[{"x":0,"y":0.044145873320537446,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.044145873320537446,"tx":0,"ty":0.044145873320537446,"absX":0,"absY":5.75,"absTx":0,"absTy":5.75,"absFx":0,"absFy":5.75},{"x":0.8420816341763745,"y":0.044145873320537446,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0469881651592925,"fy":0.13243761996161235,"tx":0.6371751031934565,"ty":-0.044145873320537446,"absX":150.00000000000006,"absY":5.75,"absTx":113.50000000000001,"absTy":-5.75,"absFx":186.5000000000001,"absFy":17.25},{"x":0.8420816341763745,"y":0.9078694817658354,"cornerRadius":0,"cornerStyle":0,"curveMode":3,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6259473480711045,"fy":1.092130518234165,"tx":1.0582159202816452,"ty":0.7236084452975051,"absX":150.00000000000006,"absY":118.25,"absTx":188.5000000000003,"absTy":94.25,"absFx":111.49999999999996,"absFy":142.24999999999991},{"x":0,"y":0.9078694817658354,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9078694817658354,"tx":0,"ty":0.9078694817658354,"absX":0,"absY":118.25,"absTx":0,"absTy":118.25,"absFx":0,"absFy":118.25}]]')

      .end();
  }
};
