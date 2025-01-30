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
      .click('#main .geometry .vt[title="0"]')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0.006666666666666667,"y":0.01,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006666666666666667,"fy":0.01,"tx":0.006666666666666667,"ty":0.01,"absX":1,"absY":1,"absTx":1,"absTy":1,"absFx":1,"absFy":1},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .click('#main .geometry .vt[title="2"]')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_LEFT)
      .keys(browser.Keys.NULL)
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_TOP)
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[2,[{"x":0.006666666666666667,"y":0.01,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006666666666666667,"fy":0.01,"tx":0.006666666666666667,"ty":0.01,"absX":1,"absY":1,"absTx":1,"absTy":1,"absFx":1,"absFy":1},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":0.9333333333333333,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9333333333333333,"fy":0.9,"tx":0.9333333333333333,"ty":0.9,"absX":140,"absY":90,"absTx":140,"absTy":90,"absFx":140,"absFy":90},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0.006666666666666667,"y":0.01,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006666666666666667,"fy":0.01,"tx":0.006666666666666667,"ty":0.01,"absX":1,"absY":1,"absTx":1,"absTy":1,"absFx":1,"absFy":1},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":150,"absY":0,"absTx":150,"absTy":0,"absFx":150,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .end();
  }
};
