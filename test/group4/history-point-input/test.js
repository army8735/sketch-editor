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
      .assert.value('#side .point-panel .x', '')
      .assert.value('#side .point-panel .y', '')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="0"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="0"]', ['vt', 'cur'])
      .mouseButtonUp(0)
      .assert.value('#side .point-panel .x', '10')
      .assert.value('#side .point-panel .y', '10')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '')

      .click('#side .point-panel .x')
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .assert.value('#side .point-panel .x', '9')
      // .assert.cssProperty('#main .geometry .vt[title="0"]', 'transform', 'matrix(1, 0, 0, 1, -1, 0)')
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":151,"absY":0,"absTx":151,"absTy":0,"absFx":151,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":151,"absY":100,"absTx":151,"absTy":100,"absFx":151,"absFy":100},{"x":0.006622516556291391,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006622516556291391,"fy":1,"tx":0.006622516556291391,"ty":1,"absX":1,"absY":100,"absTx":1,"absTy":100,"absFx":1,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .mouseButtonUp(0)
      .assert.value('#side .point-panel .x', '160')
      .assert.value('#side .point-panel .y', '10')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '')

      .click('#side .point-panel .y')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.value('#side .point-panel .y', '20')
      // .assert.cssProperty('#main .geometry .vt[title="1"]', 'transform', 'matrix(1, 0, 0, 1, 151, 10)')
      .click('#button6')
      .assert.value('#base64', '[2,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.1,"tx":1,"ty":0.1,"absX":151,"absY":10,"absTx":151,"absTy":10,"absFx":151,"absFy":10},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":151,"absY":100,"absTx":151,"absTy":100,"absFx":151,"absFy":100},{"x":0.006622516556291391,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006622516556291391,"fy":1,"tx":0.006622516556291391,"ty":1,"absX":1,"absY":100,"absTx":1,"absTy":100,"absFx":1,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .moveToElement('canvas', 50, 5)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])
      .mouseButtonUp(0)
      .assert.value('#side .point-panel .x', '160')
      .assert.value('#side .point-panel .y', '')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '多个')

      .click('#side .point-panel .x')
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .click('#side .point-panel .y')
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .assert.value('#side .point-panel .x', '161')
      .assert.value('#side .point-panel .y', '')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '多个')
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.10891089108910891,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.10891089108910891,"tx":1,"ty":0.10891089108910891,"absX":152,"absY":11,"absTx":152,"absTy":11,"absFx":152,"absFy":11},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":152,"absY":101,"absTx":152,"absTy":101,"absFx":152,"absFy":101},{"x":0.006578947368421052,"y":0.9900990099009901,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006578947368421052,"fy":0.9900990099009901,"tx":0.006578947368421052,"ty":0.9900990099009901,"absX":1,"absY":100,"absTx":1,"absTy":100,"absFx":1,"absFy":100}]]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[4,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.1,"tx":1,"ty":0.1,"absX":152,"absY":10,"absTx":152,"absTy":10,"absFx":152,"absFy":10},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":152,"absY":100,"absTx":152,"absTy":100,"absFx":152,"absFy":100},{"x":0.006578947368421052,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006578947368421052,"fy":1,"tx":0.006578947368421052,"ty":1,"absX":1,"absY":100,"absTx":1,"absTy":100,"absFx":1,"absFy":100}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .moveToElement('canvas', 50, 5)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .assert.cssClassPresent('#main .geometry .vt[title="2"]', ['vt', 'cur'])
      .mouseButtonUp(0)
      .assert.value('#side .point-panel .x', '161')
      .assert.value('#side .point-panel .y', '')
      .assert.attributeEquals('#side .point-panel .x', 'placeholder', '')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '多个')

      .updateValue('#side .point-panel .y', ['50', browser.Keys.ENTER])
      .assert.value('#side .point-panel .y', '50')
      .assert.attributeEquals('#side .point-panel .y', 'placeholder', '')
      .moveToElement('canvas', 200, 200)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[5,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0.4,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.1,"tx":1,"ty":0.1,"absX":152,"absY":40,"absTx":152,"absTy":10,"absFx":152,"absFy":10},{"x":1,"y":0.4,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":152,"absY":40,"absTx":152,"absTy":100,"absFx":152,"absFy":100},{"x":0.006578947368421052,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.006578947368421052,"fy":1,"tx":0.006578947368421052,"ty":1,"absX":1,"absY":100,"absTx":1,"absTy":100,"absFx":1,"absFy":100}]]')

      .end();
  }
};
