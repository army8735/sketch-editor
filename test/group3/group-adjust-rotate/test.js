const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .click('#button1')
      .assert.value('#base64', '0,data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+gAAAPoCAYAAABNo9TkAAAAAXNSR0IArs4c6QAAIABJREFUeF7s3V2oZWl+FvB3d2Ym02UQEfRCBiJiBwW7VbzogXSEjqggBkFI7kQFRcsPIkpOdbyxwAv7HIeJCk5jVNSgN37hB5IIQodEFIMgzkggfjBgYEQcieLYk8x093Z2W6fnTE11n3PW2nuv9TzrV1Awyey11///e95cPHlPVe2GXwQIECBAgAABAgQIECBAgMDiArvFJzAAAQIECBAgQIAAAQIECBAgMBR0h4AAAQIECBAgQIAAAQIECKxAQEFfQQhGIECAAAECBAgQIECAAAECCrozQIAAAQIECBAgQIAAAQIEViCgoK8gBCMQIECAAAECBAgQIECAAAEF3RkgQIAAAQIECBAgQIAAAQIrEFDQVxCCEQgQIECAAAECBAgQIECAgILuDBAgQIAAAQIECBAgQIAAgRUIKOgrCMEIBAgQIECAAAECBAgQIEBAQXcGCBAgQIAAAQIECBAgQIDACgQU9BWEYAQCBAgQIECAAAECBAgQIKCgOwMECBAgQIAAAQIECBAgQGAFAgr6CkIwAgECBAgQIECAAAECBAgQUNCdAQIECBAgQIAAAQIECBAgsAIBBX0FIRiBAAECBAgQIECAAAECBAgo6M4AAQIECBAgQIAAAQIECBBYgYCCvoIQjECAAAECBAgQIECAAAECBBR0Z4AAAQIECBAgQIAAAQIECKxAQEFfQQhGIECAAAECBAgQIECAAAECCrozQIAAAQIECBAgQIAAAQIEViCgoK8gBCMQIECAAAECBAgQIECAAAEF3RkgQIAAAQIECBAgQIAAAQIrEFDQVxCCEQgQIECAAAECBAgQIECAgILuDBAgQIAAAQIECBAgQIAAgRUI1BX011577Vfu9/vP7/f7d66urj6yAmMjECBAgAABAgQIECBAgACBWwUU9FuJfIAAAQIECBAgQIAAAQIECJxeQEE/vbE3ECBAgAABAgQIECBAgACBWwUU9FuJfIAAAQIECBAgQIAAAQIECJxeYPUF/fHjx8+99dZbv3+M8XvGGC/udrtfPMZ4a7/f//Rut/ubzz///F99/Pjxu9dU138GfYzx9uXl5UcfPXr0B8cYD/f7/XeMMd7d7Xb/bozx+uXl5Y+entcbCBAgQIAAAQIECBAgQIDA3QRWX9AfPXr0N8YYv2+M8ZUxxo/v9/v/Psb45WOM797tdh/d7/d//erq6g88o6C/Ncb41H6//8HdbveTT547FPxft9/v92OM77u6uvr7d2PyKQIECBAgQIAAAQIECBAgcFqBVRf0i4uLX7vb7X76cPO93+9fvrq6+rc3ivhvfPfdd//NoaS/8847L37qU5/6D4f/7ubf4j7G+J+73e63XV5e/vvr5x49evQXxhjfv9/vv/DgwYNvf/z48dunJfbtBAgQIECAAAECBAgQIEDgdoG1F/RfsdvtXtnv9x+9urr6O0+vc3Fx8RO73e67xhh/+PLy8q/cLOhPPvuDl5eXr9987vHjx9/25S9/+X987cfcP77f77/76urqzduZfIIAAQIECBAgQIAAAQIECJxWYNUF/enVD+X6S1/60i/7yEc+8i2H/+7dd9/9i7vd7nfs9/vXrq6uLp9R0F+6vLz83DOK/b/e7XafHGP8qcvLy0+flti3EyBAgAABAgQIECBAgACB2wVWX9APP+Y+xvgzY4zfvtvtfskHrPT+TfmNvyRufOUrX3nwQz/0Q19+RkH/u7vd7nsPf0b98vLyB25n8gkCBAgQIECAAAECBAgQIHBagVUX9EePHv36Mca//FqR/rb9fv/Z3W7398YY/3W/3x/+ArjDrz+x2+2+c4zxTQX98BfBXV1dPfcsvouLix/Z7XaHvxX+L19eXv6x0xL7dgIECBAgQIAAAQIECBAgcLvAqgv6xcXFP3vyI+z/8MGDB997859TO6z26NGjfzTG+F3PKuiH//7nfu7nPvbDP/zDX32a4eLi4r0b9P1+/+evrq4ubmfyCQIECBAgQIAAAQIECBAgcFqBtRf0w9/C/kt3u91vff311//F0xSPHj36L2OMX/VBBX23273w+uuv/+dnFPT3/gz6fr///qurq790WmLfToAAAQIECBAgQIAAAQIEbheIKOhjjO+6vLw8/Kj7+78uLi5+9263+weH/8V+v//TV1dXf+7wn2/+GfQxxh+5vLx84+ZzN/8W9zHGd15eXv6r25l8ggABAgQIECBAgAABAgQInFZg1QX90aNHPznGOPwza9/wo+ivvfbab9rv9/94jHG4Qf/N+/3+M1dXV3/0qYJ++LfTf/btt9/+rk9/+tM/e814cXFxtdvtfmC/33/+wYMHv/rpH5s/Lbdv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ECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQIECDgBt0ZIECAAAECBFIFFPTU5MxNgAABAm7QnQECBAgQIECgSkBBr4rTMgQI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')
      .moveToElement('canvas', 30, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.value('#side .basic-panel .w', '120.71')
      .assert.value('#side .basic-panel .h', '120.71')
      .keys(browser.Keys.META)
      .moveToElement('canvas', 100, 100)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.NULL)
      .assert.value('#side .basic-panel .x', '50')
      .assert.value('#side .basic-panel .y', '50')
      .assert.value('#side .basic-panel .r', '45')
      .assert.value('#side .basic-panel .w', '50')
      .assert.value('#side .basic-panel .h', '50')
      .click('#button2')
      .assert.value('#base64', '[1,{"left":{"v":50.00000000000001,"u":2},"top":{"v":50.00000000000001,"u":2},"right":{"v":8.578643762690488,"u":2},"bottom":{"v":8.578643762690488,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":[215,215,215,1],"u":5}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":true,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":45,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":60.3553390593274,"right":10.35533905932737,"top":60.3553390593274,"bottom":10.35533905932737,"width":50.00000000000001,"height":50.00000000000001,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[[215,215,215,1]],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[true],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[25.000000000000004,25.000000000000004],"translateX":0,"translateY":0,"rotateZ":45,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')
      .end();
  }
};
