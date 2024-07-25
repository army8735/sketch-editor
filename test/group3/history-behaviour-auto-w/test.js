const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0,{"left":{"v":13.25,"u":2},"top":{"v":7.25,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visible":{"v":true,"u":6},"fontFamily":{"v":"helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[{"v":1,"u":3},{"v":2,"u":3}],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":26.5,"top":14.5,"right":120.5,"bottom":157.5,"width":53,"height":28,"visible":true,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[1,2],"transformOrigin":[26.5,14],"translateX":-26.5,"translateY":-14,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"center":[0.5,0.5],"saturation":0,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .moveToElement('.main .select .r', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('.main .select .r', -11, 1)
      .mouseButtonUp(0)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[1,{"left":{"v":10.25,"u":2},"top":{"v":14.25,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":41,"u":1},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visible":{"v":true,"u":6},"fontFamily":{"v":"helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[{"v":1,"u":3},{"v":2,"u":3}],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":20.5,"top":28.5,"right":138.5,"bottom":115.5,"width":41,"height":56,"visible":true,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[1,2],"transformOrigin":[20.5,28],"translateX":-20.5,"translateY":-28,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"center":[0.5,0.5],"saturation":0,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[2,{"left":{"v":13.25,"u":2},"top":{"v":7.25,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visible":{"v":true,"u":6},"fontFamily":{"v":"helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[{"v":1,"u":3},{"v":2,"u":3}],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":26.5,"top":14.5,"right":120.5,"bottom":157.5,"width":53,"height":28,"visible":true,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[1,2],"transformOrigin":[26.5,14],"translateX":-26.5,"translateY":-14,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"center":[0.5,0.5],"saturation":0,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[3,{"left":{"v":10.25,"u":2},"top":{"v":14.25,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":41,"u":1},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visible":{"v":true,"u":6},"fontFamily":{"v":"helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[{"v":1,"u":3},{"v":2,"u":3}],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":20.5,"top":28.5,"right":138.5,"bottom":115.5,"width":41,"height":56,"visible":true,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[1,2],"transformOrigin":[20.5,28],"translateX":-20.5,"translateY":-28,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"center":[0.5,0.5],"saturation":0,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .click('#side .basic-panel .w input')
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[4,{"left":{"v":12.75,"u":2},"top":{"v":14.25,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":51,"u":1},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visible":{"v":true,"u":6},"fontFamily":{"v":"helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[{"v":1,"u":3},{"v":2,"u":3}],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":25.5,"top":28.5,"right":123.5,"bottom":115.5,"width":51,"height":56,"visible":true,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[1,2],"transformOrigin":[25.5,28],"translateX":-25.5,"translateY":-28,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"center":[0.5,0.5],"saturation":0,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .end();
  }
};
