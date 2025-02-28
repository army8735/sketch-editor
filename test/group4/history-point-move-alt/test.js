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
      .keys(browser.Keys.META)
      .click('#tree span.name[title="2"]')
      .keys(browser.Keys.NULL)
      .moveToElement('#main .geometry .item[idx="1"] .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .item[idx="1"] .vt[title="1"]', -10, 0)
      .mouseButtonUp(0)
      .moveToElement('#main .geometry .item[idx="0"] .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .moveToElement('#main .geometry .item[idx="0"] .vt[title="1"]', 0, 10)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[[0,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.1,"tx":1,"ty":0.1,"absX":100,"absY":10,"absTx":100,"absTy":10,"absFx":100,"absFy":10},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[0,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.9,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9,"fy":0,"tx":0.9,"ty":0,"absX":90,"absY":0,"absTx":90,"absTy":0,"absFx":90,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.9,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9,"fy":0,"tx":0.9,"ty":0,"absX":90,"absY":0,"absTx":90,"absTy":0,"absFx":90,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')
      .assert.not.elementPresent('#main geometry .vt.cur')
      .assert.cssProperty('#main .geometry .item[idx="0"]', 'top', '10px')
      .assert.cssProperty('#main .geometry .item[idx="1"]', 'top', '120px')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[[2,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[2,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[[3,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[3,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.9,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9,"fy":0,"tx":0.9,"ty":0,"absX":90,"absY":0,"absTx":90,"absTy":0,"absFx":90,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')
      .assert.not.elementPresent('#main geometry .vt.cur')
      .assert.cssProperty('#main .geometry .item[idx="0"]', 'top', '10px')
      .assert.cssProperty('#main .geometry .item[idx="1"]', 'top', '120px')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[[4,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.1,"tx":1,"ty":0.1,"absX":100,"absY":10,"absTx":100,"absTy":10,"absFx":100,"absFy":10},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[4,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.9,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9,"fy":0,"tx":0.9,"ty":0,"absX":90,"absY":0,"absTx":90,"absTy":0,"absFx":90,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')

      .end();
  }
};
