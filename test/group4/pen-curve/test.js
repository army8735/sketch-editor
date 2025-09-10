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
      .assert.elementPresent('#main .geometry svg path[title="1"]')
      .assert.not.elementPresent('#main .geometry svg path[title="2"]')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0.04770248324016894,"y":0.0797002925727394,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":-0.19037189594978882,"fy":-0.19638961965543875,"tx":0.2857768624301267,"ty":0.3557902048009176,"absX":6.011039499816251,"absY":8.660254037844386,"absTx":36.01103949981625,"absTy":38.66025403784439,"absFx":-23.98896050018375,"absFy":-21.33974596215561},{"x":0.8412837472066947,"y":0.0797002925727394,"cornerRadius":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.1587162527933053,"fy":-0.19638961965543875,"tx":0.5238512416200845,"ty":0.3557902048009176,"absX":106.01103949981625,"absY":8.660254037844386,"absTx":66.01103949981625,"absTy":38.66025403784439,"absFx":146.01103949981626,"absFy":-21.33974596215561},{"x":0.8412837472066947,"y":1,"cornerRadius":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.8412837472066947,"fy":1,"tx":0.8412837472066947,"ty":1,"absX":106.01103949981625,"absY":108.66025403784438,"absTx":106.01103949981625,"absTy":108.66025403784438,"absFx":106.01103949981625,"absFy":108.66025403784438}]]')
      .click('#button2')
      .assert.value('#base64', '[1,{"display":{"v":0,"u":3},"flexDirection":{"v":0,"u":3},"justifyContent":{"v":0,"u":3},"left":{"v":3.9889605001837487,"u":2},"top":{"v":1.3397459621556145,"u":2},"right":{"v":-30.000000000000014,"u":2},"bottom":{"v":-10.000000000000014,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"borderTopLeftRadius":{"v":0,"u":1},"borderTopRightRadius":{"v":0,"u":1},"borderBottomLeftRadius":{"v":0,"u":1},"borderBottomRightRadius":{"v":0,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":[216,216,216,1],"u":5}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":0,"u":3},"stroke":[{"v":[151,151,151,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":0,"u":3}],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":0,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2},"overflow":{"v":0,"u":3}},{"display":0,"flexDirection":0,"justifyContent":0,"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":3.9889605001837487,"right":-30.000000000000014,"top":1.3397459621556145,"bottom":-10,"width":126.01103949981626,"height":108.66025403784438,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[[216,216,216,1]],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":0,"stroke":[[151,151,151,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[0],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":0,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"overflow":0,"borderTopLeftRadius":0,"borderTopRightRadius":0,"borderBottomLeftRadius":0,"borderBottomRightRadius":0,"transformOrigin":[63.00551974990814,54.3301270189222],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .end();
  }
};
