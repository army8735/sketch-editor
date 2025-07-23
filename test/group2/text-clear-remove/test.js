const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)

      .moveToElement('canvas', 30, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0,{"left":{"v":37,"u":2},"top":{"v":38,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"borderTopLeftRadius":{"v":0,"u":1},"borderTopRightRadius":{"v":0,"u":1},"borderBottomLeftRadius":{"v":0,"u":1},"borderBottomRightRadius":{"v":0,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":48,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[72,44,35,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2},"overflow":{"v":0,"u":3}},{"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":0,"lineHeight":55.1953125,"width":54,"height":56,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":37,"top":38,"right":9,"bottom":6,"visibility":0,"color":[72,44,35,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"overflow":0,"borderTopLeftRadius":0,"borderTopRightRadius":0,"borderBottomLeftRadius":0,"borderBottomRightRadius":0,"transformOrigin":[27,28],"translateX":-27,"translateY":-28,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .click('#button3')
      .assert.value('#base64', '[1,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[72,44,35,1]}]]')

      .moveToElement('canvas', 30, 30)
      .doubleClick()
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.ARROW_RIGHT)
      .keys(browser.Keys.BACK_SPACE)
      .keys(browser.Keys.BACK_SPACE)
      .keys(browser.Keys.NULL)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 30, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[2]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[3,{"left":{"v":37,"u":2},"top":{"v":38,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"borderTopLeftRadius":{"v":0,"u":1},"borderTopRightRadius":{"v":0,"u":1},"borderBottomLeftRadius":{"v":0,"u":1},"borderBottomRightRadius":{"v":0,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":48,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[72,44,35,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2},"overflow":{"v":0,"u":3}},{"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":0,"lineHeight":55.1953125,"width":54,"height":56,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":37,"top":38,"right":9,"bottom":6,"visibility":0,"color":[72,44,35,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"overflow":0,"borderTopLeftRadius":0,"borderTopRightRadius":0,"borderBottomLeftRadius":0,"borderBottomRightRadius":0,"transformOrigin":[27,28],"translateX":-27,"translateY":-28,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .click('#button3')
      .assert.value('#base64', '[4,[{"location":0,"length":2,"fontFamily":"Helvetica","fontSize":48,"fontWeight":400,"fontStyle":"normal","letterSpacing":0,"textAlign":0,"textDecoration":[],"lineHeight":0,"paragraphSpacing":0,"color":[72,44,35,1]}]]')

      .end();
  }
};
