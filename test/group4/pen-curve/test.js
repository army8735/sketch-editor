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
      .moveToElement('canvas', 10, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 40, 40)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 10)
      .mouseButtonDown(0)
      .moveToElement('canvas', 70, 40)
      .mouseButtonUp(0)
      .moveToElement('canvas', 110, 110)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .assert.not.elementPresent('#main .geometry .vt.cur')
      .assert.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0.04770248324016894,"y":0.0797002925727394,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":-0.19037189594978882,"fy":-0.19638961965543875,"tx":0.2857768624301267,"ty":0.3557902048009176,"absX":6.011039499816251,"absY":8.660254037844386,"absTx":36.01103949981625,"absTy":38.66025403784439,"absFx":-23.98896050018375,"absFy":-21.33974596215561},{"x":0.8412837472066947,"y":0.0797002925727394,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.1587162527933053,"fy":-0.19638961965543875,"tx":0.5238512416200845,"ty":0.3557902048009176,"absX":106.01103949981625,"absY":8.660254037844386,"absTx":66.01103949981625,"absTy":38.66025403784439,"absFx":146.01103949981626,"absFy":-21.33974596215561},{"x":0.8412837472066947,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.8412837472066947,"fy":1,"tx":0.8412837472066947,"ty":1,"absX":106.01103949981625,"absY":108.66025403784438,"absTx":106.01103949981625,"absTy":108.66025403784438,"absFx":106.01103949981625,"absFy":108.66025403784438}]]')
      .click('#button2')
      .assert.value('#base64', '')

      .end();
  }
};
