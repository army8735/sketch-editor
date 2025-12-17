const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 100, 100)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .assert.cssProperty('#main .geometry .item', 'left', '158.713px')
      .assert.cssProperty('#main .geometry .item', 'top', '14.2385px')
      .assert.cssProperty('#main .geometry .item', 'transform', 'matrix(-0.866025, 0.5, 0.5, 0.866025, 0, 0)')
      .assert.cssProperty('#main .geometry .item .vt[title="1"]', 'transform', 'matrix(1, 0, 0, 1, 149.713, 0)')

      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .moveToElement('#main .geometry .vt[title="1"]', 10, 10)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.9755983040832565,"y":0.13660253545764134,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.9755983040832565,"fy":0.13660253545764134,"tx":0.9755983040832565,"ty":0.13660253545764134,"absX":146.33974561248849,"absY":13.660253545764133,"absTx":146.33974561248849,"absTy":13.660253545764133,"absFx":146.33974561248849,"absFy":13.660253545764133},{"x":1,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":150,"absY":100,"absTx":150,"absTy":100,"absFx":150,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]')

      .end();
  }
};
