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
      .assert.value('#base64', '[0,{"left":{"v":10,"u":2},"top":{"v":10,"u":2},"right":{"v":-10,"u":2},"bottom":{"v":-10,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":{"t":0,"d":[0.5,0,0.5,1],"stops":[{"color":{"v":[255,0,0,1],"u":5},"offset":{"v":0,"u":2}},{"color":{"v":[0,0,255,1],"u":5},"offset":{"v":100,"u":2}}]},"u":8}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":10,"right":-10,"top":10,"bottom":-10,"width":100,"height":100,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[{"t":0,"d":[0.5,0,0.5,1],"stops":[{"color":[255,0,0,1],"offset":0},{"color":[0,0,255,1],"offset":1}]}],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[50,50],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .assert.value('#side .fill-panel .line[title="0"] .gradient select', '0')
      .assert.cssProperty('#side .fill-panel .line[title="0"] .color .picker-btn b', 'backgroundImage', 'linear-gradient(180deg, rgba(254,0,0,1) 0%, rgba(0,0,255,1) 100%)')

      .click('#side .fill-panel .color .picker-btn b')
      .click('.sketch-editor-picker .type .radial')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[1,{"left":{"v":10,"u":2},"top":{"v":10,"u":2},"right":{"v":-10,"u":2},"bottom":{"v":-10,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":{"t":1,"d":[0.5,0.5,0.5,1,0],"stops":[{"color":{"v":[255,0,0,1],"u":5},"offset":{"v":0,"u":2}},{"color":{"v":[0,0,255,1],"u":5},"offset":{"v":100,"u":2}}]},"u":8}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":10,"right":-10,"top":10,"bottom":-10,"width":100,"height":100,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[{"t":1,"d":[0.5,0.5,0.5,1,0],"stops":[{"color":[255,0,0,1],"offset":0},{"color":[0,0,255,1],"offset":1}]}],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[50,50],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .assert.value('#side .fill-panel .line[title="0"] .gradient select', '1')
      .assert.cssProperty('#side .fill-panel .line[title="0"] .color .picker-btn b', 'backgroundImage', 'radial-gradient(circle at 50% 50%, rgba(255,0,0,1) 0%, rgba(0,0,255,1) 100%)')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[2,{"left":{"v":10,"u":2},"top":{"v":10,"u":2},"right":{"v":-10,"u":2},"bottom":{"v":-10,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":{"t":0,"d":[0.5,0,0.5,1],"stops":[{"color":{"v":[255,0,0,1],"u":5},"offset":{"v":0,"u":2}},{"color":{"v":[0,0,255,1],"u":5},"offset":{"v":100,"u":2}}]},"u":8}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":10,"right":-10,"top":10,"bottom":-10,"width":100,"height":100,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[{"t":0,"d":[0.5,0,0.5,1],"stops":[{"color":[255,0,0,1],"offset":0},{"color":[0,0,255,1],"offset":1}]}],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[50,50],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .assert.value('#side .fill-panel .line[title="0"] .gradient select', '0')
      .assert.cssProperty('#side .fill-panel .line[title="0"] .color .picker-btn b', 'backgroundImage', 'linear-gradient(180deg, rgba(254,0,0,1) 0%, rgba(0,0,255,1) 100%)')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[3,{"left":{"v":10,"u":2},"top":{"v":10,"u":2},"right":{"v":-10,"u":2},"bottom":{"v":-10,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":{"t":1,"d":[0.5,0.5,0.5,1,0],"stops":[{"color":{"v":[255,0,0,1],"u":5},"offset":{"v":0,"u":2}},{"color":{"v":[0,0,255,1],"u":5},"offset":{"v":100,"u":2}}]},"u":8}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":10,"right":-10,"top":10,"bottom":-10,"width":100,"height":100,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[{"t":1,"d":[0.5,0.5,0.5,1,0],"stops":[{"color":[255,0,0,1],"offset":0},{"color":[0,0,255,1],"offset":1}]}],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[50,50],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .assert.value('#side .fill-panel .line[title="0"] .gradient select', '1')
      .assert.cssProperty('#side .fill-panel .line[title="0"] .color .picker-btn b', 'backgroundImage', 'radial-gradient(circle at 50% 50%, rgba(255,0,0,1) 0%, rgba(0,0,255,1) 100%)')

      .updateValue('#side .fill-panel .line[title="0"] .gradient select', '2')
      .click('#button2')
      .assert.value('#base64', '[4,{"left":{"v":10,"u":2},"top":{"v":10,"u":2},"right":{"v":-10,"u":2},"bottom":{"v":-10,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":{"t":2,"d":[],"stops":[{"color":{"v":[255,0,0,1],"u":5},"offset":{"v":0,"u":2}},{"color":{"v":[0,0,255,1],"u":5},"offset":{"v":100,"u":2}}]},"u":8}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":10,"right":-10,"top":10,"bottom":-10,"width":100,"height":100,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[{"t":2,"d":[],"stops":[{"color":[255,0,0,1],"offset":0},{"color":[0,0,255,1],"offset":1}]}],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[50,50],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .assert.cssProperty('#side .fill-panel .line[title="0"] .color .picker-btn b', 'backgroundImage', 'radial-gradient(circle at 50% 50%, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)')

      .end();
  }
};
