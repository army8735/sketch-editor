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
      .assert.cssClassPresent('#main .canvas-c', 'add-pen')
      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .assert.not.cssClassPresent('#main .canvas-c', 'add-pen')
      .assert.elementPresent('#tree dt span.name')
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 10)
      .assert.cssClassPresent('#main .canvas-c', 'add-pen')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 110)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 10, 10)
      .assert.not.cssClassPresent('#main .canvas-c', 'add-pen')
      .assert.cssClassPresent('#main .canvas-c', 'fin-pen')
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100}]]')
      .click('#button2')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '[2,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry svg path[title="1"]')
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#main .geometry svg path[title="1"]')
      .click('#button6')
      .assert.value('#base64', '[4,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .assert.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '[5,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100}]]')

      .end();
  }
};
