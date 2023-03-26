(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.editor = {}));
})(this, (function (exports) { 'use strict';

    function getDefaultStyle(v) {
        return Object.assign({
            left: 0,
            top: 0,
            right: 'auto',
            bottom: 'auto',
            width: 'auto',
            height: 'auto',
            lineHeight: 'normal',
            visible: true,
            overflow: 'visible',
            fontFamily: 'arial',
            fontSize: 16,
            fontWeight: 400,
            fontStyle: 'normal',
            backgroundColor: [0, 0, 0, 0],
            opacity: 1,
            translateX: 0,
            translateY: 0,
            scaleX: 1,
            scaleY: 1,
            rotateZ: 0,
            transformOrigin: ['center', 'center'],
            mixBlendMode: 'normal',
        }, v);
    }
    var classValue;
    (function (classValue) {
        classValue["Page"] = "Page";
        classValue["ArtBoard"] = "ArtBoard";
        classValue["Group"] = "Group";
        classValue["Bitmap"] = "Bitmap";
        classValue["Text"] = "Text";
        classValue["Rect"] = "Rect";
    })(classValue || (classValue = {}));

    // @ts-ignore
    const toString = {}.toString;
    function isType(type) {
        return function (obj) {
            return toString.call(obj) === '[object ' + type + ']';
        };
    }
    function isTypes(types) {
        return function (obj) {
            let s = toString.call(obj);
            for (let i = 0, len = types.length; i < len; i++) {
                if (s === '[object ' + types[i] + ']') {
                    return true;
                }
            }
            return false;
        };
    }
    const isString = isType('String');
    const isFunction = isTypes(['Function', 'AsyncFunction', 'GeneratorFunction']);
    const isNumber = isType('Number');
    const hasOwn = {}.hasOwnProperty;
    const fnToString = hasOwn.toString;
    fnToString.call(Object);
    function isNil(v) {
        return v === undefined || v === null;
    }

    var StyleKey;
    (function (StyleKey) {
        StyleKey[StyleKey["TOP"] = 0] = "TOP";
        StyleKey[StyleKey["RIGHT"] = 1] = "RIGHT";
        StyleKey[StyleKey["BOTTOM"] = 2] = "BOTTOM";
        StyleKey[StyleKey["LEFT"] = 3] = "LEFT";
        StyleKey[StyleKey["WIDTH"] = 4] = "WIDTH";
        StyleKey[StyleKey["HEIGHT"] = 5] = "HEIGHT";
        StyleKey[StyleKey["LINE_HEIGHT"] = 6] = "LINE_HEIGHT";
        StyleKey[StyleKey["FONT_FAMILY"] = 7] = "FONT_FAMILY";
        StyleKey[StyleKey["FONT_SIZE"] = 8] = "FONT_SIZE";
        StyleKey[StyleKey["FONT_WEIGHT"] = 9] = "FONT_WEIGHT";
        StyleKey[StyleKey["FONT_STYLE"] = 10] = "FONT_STYLE";
        StyleKey[StyleKey["VISIBLE"] = 11] = "VISIBLE";
        StyleKey[StyleKey["BACKGROUND_COLOR"] = 12] = "BACKGROUND_COLOR";
        StyleKey[StyleKey["OVERFLOW"] = 13] = "OVERFLOW";
        StyleKey[StyleKey["OPACITY"] = 14] = "OPACITY";
        StyleKey[StyleKey["TRANSLATE_X"] = 15] = "TRANSLATE_X";
        StyleKey[StyleKey["TRANSLATE_Y"] = 16] = "TRANSLATE_Y";
        StyleKey[StyleKey["SCALE_X"] = 17] = "SCALE_X";
        StyleKey[StyleKey["SCALE_Y"] = 18] = "SCALE_Y";
        StyleKey[StyleKey["ROTATE_Z"] = 19] = "ROTATE_Z";
        StyleKey[StyleKey["TRANSFORM_ORIGIN"] = 20] = "TRANSFORM_ORIGIN";
        StyleKey[StyleKey["MIX_BLEND_MODE"] = 21] = "MIX_BLEND_MODE";
        // FILTER = 14,
        // FILL = 15,
        // STROKE = 16,
        // STROKE_WIDTH = 17,
        // STROKE_DASHARRAY = 18,
        // STROKE_DASHARRAY_STR = 19,
        // STROKE_LINECAP = 20,
        // STROKE_LINEJOIN = 21,
        // STROKE_MITERLIMIT = 22,
        // FILL_RULE = 23,
    })(StyleKey || (StyleKey = {}));
    const STYLE2UPPER_MAP = {};
    function styleKey2Upper(s) {
        let res = STYLE2UPPER_MAP[s];
        if (!res) {
            res = STYLE2UPPER_MAP[s] = s.replace(/([a-z\d_])([A-Z])/g, function ($0, $1, $2) {
                return $1 + '_' + $2;
            }).toUpperCase();
        }
        return res;
    }
    var StyleUnit;
    (function (StyleUnit) {
        StyleUnit[StyleUnit["AUTO"] = 0] = "AUTO";
        StyleUnit[StyleUnit["PX"] = 1] = "PX";
        StyleUnit[StyleUnit["PERCENT"] = 2] = "PERCENT";
        StyleUnit[StyleUnit["NUMBER"] = 3] = "NUMBER";
        StyleUnit[StyleUnit["DEG"] = 4] = "DEG";
        StyleUnit[StyleUnit["RGBA"] = 5] = "RGBA";
        StyleUnit[StyleUnit["BOOLEAN"] = 6] = "BOOLEAN";
        StyleUnit[StyleUnit["STRING"] = 7] = "STRING";
        StyleUnit[StyleUnit["GRADIENT"] = 8] = "GRADIENT";
    })(StyleUnit || (StyleUnit = {}));
    function calUnit(v) {
        if (v === 'auto') {
            return {
                v: 0,
                u: StyleUnit.AUTO,
            };
        }
        let n = parseFloat(v) || 0;
        if (/%$/.test(v)) {
            return {
                v: n,
                u: StyleUnit.PERCENT,
            };
        }
        else if (/px$/i.test(v)) {
            return {
                v: n,
                u: StyleUnit.PX,
            };
        }
        else if (/deg$/i.test(v)) {
            return {
                v: n,
                u: StyleUnit.DEG,
            };
        }
        return {
            v: n,
            u: StyleUnit.NUMBER,
        };
    }
    var MIX_BLEND_MODE;
    (function (MIX_BLEND_MODE) {
        MIX_BLEND_MODE[MIX_BLEND_MODE["NORMAL"] = 0] = "NORMAL";
        MIX_BLEND_MODE[MIX_BLEND_MODE["MULTIPLY"] = 1] = "MULTIPLY";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SCREEN"] = 2] = "SCREEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["OVERLAY"] = 3] = "OVERLAY";
        MIX_BLEND_MODE[MIX_BLEND_MODE["DARKEN"] = 4] = "DARKEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["LIGHTEN"] = 5] = "LIGHTEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR_DODGE"] = 6] = "COLOR_DODGE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR_BURN"] = 7] = "COLOR_BURN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["HARD_LIGHT"] = 8] = "HARD_LIGHT";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SOFT_LIGHT"] = 9] = "SOFT_LIGHT";
        MIX_BLEND_MODE[MIX_BLEND_MODE["DIFFERENCE"] = 10] = "DIFFERENCE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["EXCLUSION"] = 11] = "EXCLUSION";
        MIX_BLEND_MODE[MIX_BLEND_MODE["HUE"] = 12] = "HUE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SATURATION"] = 13] = "SATURATION";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR"] = 14] = "COLOR";
        MIX_BLEND_MODE[MIX_BLEND_MODE["LUMINOSITY"] = 15] = "LUMINOSITY";
    })(MIX_BLEND_MODE || (MIX_BLEND_MODE = {}));
    var OVERFLOW;
    (function (OVERFLOW) {
        OVERFLOW[OVERFLOW["VISIBLE"] = 0] = "VISIBLE";
        OVERFLOW[OVERFLOW["HIDDEN"] = 1] = "HIDDEN";
    })(OVERFLOW || (OVERFLOW = {}));
    var FONT_STYLE;
    (function (FONT_STYLE) {
        FONT_STYLE[FONT_STYLE["NORMAL"] = 0] = "NORMAL";
        FONT_STYLE[FONT_STYLE["ITALIC"] = 1] = "ITALIC";
        FONT_STYLE[FONT_STYLE["OBLIQUE"] = 2] = "OBLIQUE";
    })(FONT_STYLE || (FONT_STYLE = {}));
    var MASK_TYPE;
    (function (MASK_TYPE) {
        MASK_TYPE[MASK_TYPE["NONE"] = 0] = "NONE";
        MASK_TYPE[MASK_TYPE["MASK"] = 1] = "MASK";
        MASK_TYPE[MASK_TYPE["CLIP"] = 2] = "CLIP";
    })(MASK_TYPE || (MASK_TYPE = {}));

    var RefreshLevel;
    (function (RefreshLevel) {
        RefreshLevel[RefreshLevel["NONE"] = 0] = "NONE";
        RefreshLevel[RefreshLevel["CACHE"] = 1] = "CACHE";
        RefreshLevel[RefreshLevel["TRANSLATE_X"] = 2] = "TRANSLATE_X";
        RefreshLevel[RefreshLevel["TRANSLATE_Y"] = 4] = "TRANSLATE_Y";
        RefreshLevel[RefreshLevel["TRANSLATE"] = 6] = "TRANSLATE";
        RefreshLevel[RefreshLevel["ROTATE_Z"] = 8] = "ROTATE_Z";
        RefreshLevel[RefreshLevel["SCALE_X"] = 16] = "SCALE_X";
        RefreshLevel[RefreshLevel["SCALE_Y"] = 32] = "SCALE_Y";
        RefreshLevel[RefreshLevel["SCALE"] = 48] = "SCALE";
        RefreshLevel[RefreshLevel["TRANSFORM"] = 64] = "TRANSFORM";
        RefreshLevel[RefreshLevel["TRANSFORM_ALL"] = 126] = "TRANSFORM_ALL";
        RefreshLevel[RefreshLevel["OPACITY"] = 128] = "OPACITY";
        RefreshLevel[RefreshLevel["FILTER"] = 256] = "FILTER";
        RefreshLevel[RefreshLevel["MIX_BLEND_MODE"] = 512] = "MIX_BLEND_MODE";
        RefreshLevel[RefreshLevel["MASK"] = 1024] = "MASK";
        RefreshLevel[RefreshLevel["REPAINT"] = 2048] = "REPAINT";
        RefreshLevel[RefreshLevel["REFLOW"] = 4096] = "REFLOW";
        RefreshLevel[RefreshLevel["REBUILD"] = 8192] = "REBUILD";
    })(RefreshLevel || (RefreshLevel = {}));
    function isReflow(lv) {
        return lv >= RefreshLevel.REFLOW;
    }
    function isRepaint(lv) {
        return lv < RefreshLevel.REFLOW;
    }
    function getLevel(k) {
        if (k === StyleKey.TRANSLATE_X) {
            return RefreshLevel.TRANSLATE_X;
        }
        if (k === StyleKey.TRANSLATE_Y) {
            return RefreshLevel.TRANSLATE_Y;
        }
        if (k === StyleKey.ROTATE_Z) {
            return RefreshLevel.ROTATE_Z;
        }
        if (k === StyleKey.SCALE_X) {
            return RefreshLevel.SCALE_X;
        }
        if (k === StyleKey.SCALE_Y) {
            return RefreshLevel.SCALE_Y;
        }
        if (k === StyleKey.TRANSFORM_ORIGIN) {
            return RefreshLevel.TRANSFORM;
        }
        if (k === StyleKey.OPACITY) {
            return RefreshLevel.OPACITY;
        }
        if (k === StyleKey.MIX_BLEND_MODE) {
            return RefreshLevel.MIX_BLEND_MODE;
        }
        if (isRepaint(k)) {
            return RefreshLevel.REPAINT;
        }
        return RefreshLevel.REFLOW;
    }

    function identity() {
        return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    // 16位单位矩阵判断，空也认为是
    function isE(m) {
        if (!m || !m.length) {
            return true;
        }
        return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 0
            && m[4] === 0 && m[5] === 1 && m[6] === 0 && m[7] === 0
            && m[8] === 0 && m[9] === 0 && m[10] === 1 && m[11] === 0
            && m[12] === 0 && m[13] === 0 && m[14] === 0 && m[15] === 1;
    }
    // 矩阵a*b，固定两个matrix都是长度16
    function multiply(a, b) {
        if (!a && !b) {
            return identity();
        }
        if (isE(a)) {
            return b;
        }
        if (isE(b)) {
            return a;
        }
        let c = identity();
        for (let i = 0; i < 4; i++) {
            let a0 = a[i] || 0;
            let a1 = a[i + 4] || 0;
            let a2 = a[i + 8] || 0;
            let a3 = a[i + 12] || 0;
            c[i] = a0 * b[0] + a1 * b[1] + a2 * b[2] + a3 * b[3];
            c[i + 4] = a0 * b[4] + a1 * b[5] + a2 * b[6] + a3 * b[7];
            c[i + 8] = a0 * b[8] + a1 * b[9] + a2 * b[10] + a3 * b[11];
            c[i + 12] = a0 * b[12] + a1 * b[13] + a2 * b[14] + a3 * b[15];
        }
        return c;
    }
    function assignMatrix(t, v) {
        if (t && v) {
            t[0] = v[0];
            t[1] = v[1];
            t[2] = v[2];
            t[3] = v[3];
            t[4] = v[4];
            t[5] = v[5];
            t[6] = v[6];
            t[7] = v[7];
            t[8] = v[8];
            t[9] = v[9];
            t[10] = v[10];
            t[11] = v[11];
            t[12] = v[12];
            t[13] = v[13];
            t[14] = v[14];
            t[15] = v[15];
        }
        return t;
    }
    function multiplyTfo(m, x, y) {
        if (!x && !y) {
            return m;
        }
        m[12] += m[0] * x + m[4] * y;
        m[13] += m[1] * x + m[5] * y;
        m[14] += m[2] * x + m[6] * y;
        m[15] += m[3] * x + m[7] * y;
        return m;
    }
    function tfoMultiply(x, y, m) {
        if (!x && !y) {
            return m;
        }
        let d = m[3], h = m[7], l = m[11], p = m[15];
        m[0] += d * x;
        m[1] += d * y;
        m[4] += h * x;
        m[5] += h * y;
        m[8] += l * x;
        m[9] += l * y;
        m[12] += p * x;
        m[13] += p * y;
        return m;
    }
    function multiplyRotateZ(m, v) {
        if (!v) {
            return m;
        }
        let sin = Math.sin(v);
        let cos = Math.cos(v);
        let a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7];
        m[0] = a * cos + e * sin;
        m[1] = b * cos + f * sin;
        m[2] = c * cos + g * sin;
        m[3] = d * cos + h * sin;
        m[4] = a * -sin + e * cos;
        m[5] = b * -sin + f * cos;
        m[6] = c * -sin + g * cos;
        m[7] = d * -sin + h * cos;
        return m;
    }
    function multiplyScaleX(m, v) {
        if (v === 1) {
            return m;
        }
        m[0] *= v;
        m[1] *= v;
        m[2] *= v;
        m[3] *= v;
        return m;
    }
    function multiplyScaleY(m, v) {
        if (v === 1) {
            return m;
        }
        m[4] *= v;
        m[5] *= v;
        m[6] *= v;
        m[7] *= v;
        return m;
    }
    function calPoint(point, m) {
        if (m && !isE(m)) {
            let { x, y } = point;
            let a1 = m[0], b1 = m[1];
            let a2 = m[4], b2 = m[5];
            let a4 = m[12], b4 = m[13];
            let o = {
                x: ((a1 === 1) ? x : (x * a1)) + (a2 ? (y * a2) : 0) + a4,
                y: ((b1 === 1) ? x : (x * b1)) + (b2 ? (y * b2) : 0) + b4,
            };
            return o;
        }
        return point;
    }
    function calRectPoint(xa, ya, xb, yb, matrix) {
        let { x: x1, y: y1 } = calPoint({ x: xa, y: ya }, matrix);
        let { x: x3, y: y3 } = calPoint({ x: xb, y: yb }, matrix);
        let x2, y2, x4, y4;
        // 无旋转的时候可以少算2个点
        if (!matrix || !matrix.length
            || !matrix[1] && !matrix[2] && !matrix[4] && !matrix[6] && !matrix[7] && !matrix[8]) {
            x2 = x3;
            y2 = y1;
            x4 = x1;
            y4 = y3;
        }
        else {
            let t = calPoint({ x: xb, y: ya }, matrix);
            x2 = t.x;
            y2 = t.y;
            t = calPoint({ x: xa, y: yb }, matrix);
            x4 = t.x;
            y4 = t.y;
        }
        return { x1, y1, x2, y2, x3, y3, x4, y4 };
    }

    const TRANSFORM_HASH = {
        translateX: StyleKey.TRANSLATE_X,
        translateY: StyleKey.TRANSLATE_Y,
        scaleX: StyleKey.SCALE_X,
        scaleY: StyleKey.SCALE_Y,
        rotateZ: StyleKey.ROTATE_Z,
        rotate: StyleKey.ROTATE_Z,
    };
    function compatibleTransform(k, v) {
        if (k === StyleKey.SCALE_X || k === StyleKey.SCALE_Y) {
            v.u = StyleUnit.NUMBER;
        }
        else if (k === StyleKey.TRANSLATE_X || k === StyleKey.TRANSLATE_Y) {
            if (v.u === StyleUnit.NUMBER) {
                v.u = StyleUnit.PX;
            }
        }
        else {
            if (v.u === StyleUnit.NUMBER) {
                v.u = StyleUnit.DEG;
            }
        }
    }
    function normalizeStyle(style) {
        const res = {};
        [
            'left',
            'top',
            'right',
            'bottom',
            'width',
            'height',
        ].forEach(k => {
            let v = style[k];
            if (isNil(v)) {
                return;
            }
            const n = calUnit(v || 0);
            // 无单位视为px
            if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                n.u = StyleUnit.PX;
            }
            // 限定正数
            if (k === 'width' || k === 'height') {
                if (n.v < 0) {
                    n.v = 0;
                }
            }
            const k2 = StyleKey[styleKey2Upper(k)];
            res[k2] = n;
        });
        const lineHeight = style.lineHeight;
        if (!isNil(lineHeight)) {
            if (lineHeight === 'normal') {
                res[StyleKey.LINE_HEIGHT] = {
                    v: 0,
                    u: StyleUnit.AUTO,
                };
            }
            else {
                let n = calUnit(lineHeight || 0);
                if (n.v <= 0) {
                    n = {
                        v: 0,
                        u: StyleUnit.AUTO,
                    };
                }
                else if ([StyleUnit.DEG, StyleUnit.NUMBER].indexOf(n.u) > -1) {
                    n.u = StyleUnit.PX;
                }
                res[StyleKey.LINE_HEIGHT] = n;
            }
        }
        const visible = style.visible;
        if (!isNil(visible)) {
            res[StyleKey.VISIBLE] = {
                v: visible,
                u: StyleUnit.BOOLEAN,
            };
        }
        const fontFamily = style.fontFamily;
        if (!isNil(fontFamily)) {
            res[StyleKey.FONT_FAMILY] = {
                v: fontFamily.toString().trim().toLowerCase()
                    .replace(/['"]/g, '')
                    .replace(/\s*,\s*/g, ','),
                u: StyleUnit.STRING,
            };
        }
        const fontSize = style.fontSize;
        if (!isNil(fontSize)) {
            let n = calUnit(fontSize || 16);
            if (n.v <= 0) {
                n.v = 16;
            }
            // 防止小数
            n.v = Math.floor(n.v);
            if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                n.u = StyleUnit.PX;
            }
            res[StyleKey.FONT_SIZE] = n;
        }
        const fontWeight = style.fontWeight;
        if (!isNil(fontWeight)) {
            if (/normal/i.test(fontWeight)) {
                res[StyleKey.FONT_WEIGHT] = { v: 400, u: StyleUnit.NUMBER };
            }
            else if (/bold/i.test(fontWeight)) {
                res[StyleKey.FONT_WEIGHT] = { v: 700, u: StyleUnit.NUMBER };
            }
            else if (/bolder/i.test(fontWeight)) {
                res[StyleKey.FONT_WEIGHT] = { v: 900, u: StyleUnit.NUMBER };
            }
            else if (/lighter/i.test(fontWeight)) {
                res[StyleKey.FONT_WEIGHT] = { v: 300, u: StyleUnit.NUMBER };
            }
            else {
                res[StyleKey.FONT_WEIGHT] = {
                    v: Math.min(900, Math.max(100, parseInt(fontWeight) || 400)),
                    u: StyleUnit.NUMBER,
                };
            }
        }
        const fontStyle = style.fontStyle;
        if (!isNil(fontStyle)) {
            let v = FONT_STYLE.NORMAL;
            if (/italic/i.test(fontStyle)) {
                v = FONT_STYLE.ITALIC;
            }
            else if (/oblique/i.test(fontStyle)) {
                v = FONT_STYLE.OBLIQUE;
            }
            res[StyleKey.FONT_STYLE] = { v, u: StyleUnit.NUMBER };
        }
        const backgroundColor = style.backgroundColor;
        if (!isNil(backgroundColor)) {
            res[StyleKey.BACKGROUND_COLOR] = { v: color2rgbaInt(backgroundColor), u: StyleUnit.RGBA };
        }
        const overflow = style.overflow;
        if (!isNil(overflow)) {
            res[StyleKey.OVERFLOW] = { v: overflow, u: StyleUnit.STRING };
        }
        const opacity = style.opacity;
        if (!isNil(opacity)) {
            res[StyleKey.OPACITY] = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
        }
        [
            'translateX',
            'translateY',
            'scaleX',
            'scaleY',
            'rotateZ',
        ].forEach(k => {
            let v = style[k];
            if (isNil(v)) {
                return;
            }
            const k2 = TRANSFORM_HASH[k];
            const n = calUnit(v);
            // 没有单位或默认值处理单位
            compatibleTransform(k2, n);
            res[k2] = n;
        });
        const transformOrigin = style.transformOrigin;
        if (!isNil(transformOrigin)) {
            let o;
            if (Array.isArray(transformOrigin)) {
                o = transformOrigin;
            }
            else {
                o = transformOrigin.match(/(([-+]?[\d.]+[pxremvwhina%]*)|(left|top|right|bottom|center)){1,2}/ig);
            }
            if (o.length === 1) {
                o[1] = o[0];
            }
            const arr = [
                { v: 50, u: StyleUnit.PERCENT },
                { v: 50, u: StyleUnit.PERCENT },
            ];
            for (let i = 0; i < 2; i++) {
                let item = o[i];
                if (/^[-+]?[\d.]/.test(item)) {
                    let n = calUnit(item);
                    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                        n.u = StyleUnit.PX;
                    }
                    arr.push(n);
                }
                else {
                    arr.push({
                        v: {
                            top: 0,
                            left: 0,
                            center: 50,
                            right: 100,
                            bottom: 100,
                        }[item],
                        u: StyleUnit.PERCENT,
                    });
                    // 不规范的写法变默认值50%
                    if (isNil(arr[i].v)) {
                        arr[i].v = 50;
                    }
                }
            }
            res[StyleKey.TRANSFORM_ORIGIN] = arr;
        }
        const mixBlendMode = style.mixBlendMode;
        if (!isNil(mixBlendMode)) {
            let v = MIX_BLEND_MODE.NORMAL;
            if (/multiply/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.MULTIPLY;
            }
            else if (/screen/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SCREEN;
            }
            else if (/overlay/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.OVERLAY;
            }
            else if (/darken/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.DARKEN;
            }
            else if (/lighten/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.LIGHTEN;
            }
            else if (/color-dodge/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR_DODGE;
            }
            else if (/color-burn/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR_BURN;
            }
            else if (/hard-light/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.HARD_LIGHT;
            }
            else if (/soft-light/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SOFT_LIGHT;
            }
            else if (/difference/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.DIFFERENCE;
            }
            else if (/exclusion/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.EXCLUSION;
            }
            else if (/hue/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.HUE;
            }
            else if (/saturation/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SATURATION;
            }
            else if (/color/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR;
            }
            else if (/luminosity/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.LUMINOSITY;
            }
            res[StyleKey.MIX_BLEND_MODE] = { v, u: StyleUnit.NUMBER };
        }
        return res;
    }
    function equalStyle(k, a, b) {
        if (k === StyleKey.TRANSFORM_ORIGIN) {
            return a[k][0].v === b[k][0].v && a[k][0].u === b[k][0].u
                && a[k][1].v === b[k][1].v && a[k][1].u === b[k][1].u;
        }
        if (k === StyleKey.BACKGROUND_COLOR) {
            return a[k].v[0] === b[k].v[0]
                && a[k].v[1] === b[k].v[1]
                && a[k].v[2] === b[k].v[2]
                && a[k].v[3] === b[k].v[3];
        }
        return a[k].v === b[k].v && a[k].u === b[k].u;
    }
    function color2rgbaInt(color) {
        if (Array.isArray(color)) {
            return color;
        }
        let res = [];
        if (!color || color === 'transparent') {
            res = [0, 0, 0, 0];
        }
        else if (color.charAt(0) === '#') {
            color = color.slice(1);
            if (color.length === 3) {
                res.push(parseInt(color.charAt(0) + color.charAt(0), 16));
                res.push(parseInt(color.charAt(1) + color.charAt(1), 16));
                res.push(parseInt(color.charAt(2) + color.charAt(2), 16));
                res[3] = 1;
            }
            else if (color.length === 6) {
                res.push(parseInt(color.slice(0, 2), 16));
                res.push(parseInt(color.slice(2, 4), 16));
                res.push(parseInt(color.slice(4), 16));
                res[3] = 1;
            }
            else if (color.length === 8) {
                res.push(parseInt(color.slice(0, 2), 16));
                res.push(parseInt(color.slice(2, 4), 16));
                res.push(parseInt(color.slice(4, 6), 16));
                res.push(parseInt(color.slice(6), 16) / 255);
            }
            else {
                res[0] = res[1] = res[2] = 0;
                res[3] = 1;
            }
        }
        else {
            let c = color.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (c) {
                res = [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])];
                if (!isNil(c[4])) {
                    res[3] = parseFloat(c[4]);
                }
                else {
                    res[3] = 1;
                }
            }
            else {
                res = [0, 0, 0, 0];
            }
        }
        return res;
    }

    function extend(target, source, keys) {
        if (source === null || typeof source !== 'object') {
            return target;
        }
        if (!keys) {
            keys = Object.keys(source);
        }
        let i = 0;
        const len = keys.length;
        while (i < len) {
            const k = keys[i];
            target[k] = source[k];
            i++;
        }
        return target;
    }

    function d2r(n) {
        return n * Math.PI / 180;
    }

    function calRotateZ(t, v) {
        v = d2r(v);
        let sin = Math.sin(v);
        let cos = Math.cos(v);
        t[0] = t[5] = cos;
        t[1] = sin;
        t[4] = -sin;
        return t;
    }
    // 已有计算好的变换矩阵，根据tfo原点计算最终的matrix
    function calMatrixByOrigin(m, ox, oy) {
        let res = m.slice(0);
        if (ox === 0 && oy === 0 || isE(m)) {
            return res;
        }
        res = tfoMultiply(ox, oy, res);
        res = multiplyTfo(res, -ox, -oy);
        return res;
    }

    class Node {
        constructor(name, props) {
            this.name = name;
            this.props = props;
            this.style = extend([], normalizeStyle(props.style || {}));
            this.computedStyle = []; // 输出展示的值
            this.cacheStyle = []; // 缓存js直接使用的对象结果
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.isDestroyed = true;
            this.struct = {
                node: this,
                num: 0,
                total: 0,
                lv: 0,
            };
            this.refreshLevel = RefreshLevel.REFLOW;
            this.opacity = 1;
            this.transform = identity();
            this.matrix = identity();
            this.matrixWorld = identity();
            this.hasContent = false;
        }
        didMount() {
            this.isDestroyed = false;
            this.root = this.parent.root;
        }
        layout(container, data) {
            if (this.isDestroyed) {
                return;
            }
            // 布局时计算所有样式，更新时根据不同级别调用
            this.calReflowStyle();
            this.calRepaintStyle();
            // 布局数据在更新时会用到
            this.layoutData = {
                x: data.x,
                y: data.y,
                w: data.w,
                h: data.h,
            };
            const { style, computedStyle } = this;
            const { [StyleKey.LEFT]: left, [StyleKey.TOP]: top, [StyleKey.RIGHT]: right, [StyleKey.BOTTOM]: bottom, [StyleKey.WIDTH]: width, [StyleKey.HEIGHT]: height, } = style;
            let fixedLeft = false;
            let fixedTop = false;
            let fixedRight = false;
            let fixedBottom = false;
            if (left.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.LEFT] = 'auto';
            }
            else {
                fixedLeft = true;
                computedStyle[StyleKey.LEFT] = this.calSize(left, data.w);
            }
            if (right.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.RIGHT] = 'auto';
            }
            else {
                fixedRight = true;
                computedStyle[StyleKey.RIGHT] = this.calSize(right, data.w);
            }
            if (top.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.TOP] = 'auto';
            }
            else {
                fixedTop = true;
                computedStyle[StyleKey.TOP] = this.calSize(top, data.h);
            }
            if (bottom.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.BOTTOM] = 'auto';
            }
            else {
                fixedBottom = true;
                computedStyle[StyleKey.BOTTOM] = this.calSize(bottom, data.h);
            }
            if (width.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.WIDTH] = 'auto';
            }
            else {
                computedStyle[StyleKey.WIDTH] = this.calSize(width, data.w);
            }
            if (height.u === StyleUnit.AUTO) {
                computedStyle[StyleKey.HEIGHT] = 'auto';
            }
            else {
                computedStyle[StyleKey.HEIGHT] = this.calSize(height, data.h);
            }
            // 左右决定x+width
            if (fixedLeft && fixedRight) {
                this.x = data.x + computedStyle[StyleKey.LEFT];
                this.width = data.w - computedStyle[StyleKey.LEFT] - computedStyle[StyleKey.RIGHT];
            }
            else if (fixedLeft) {
                this.x = data.x + computedStyle[StyleKey.LEFT];
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle[StyleKey.WIDTH];
                }
                else {
                    this.width = 0;
                }
            }
            else if (fixedRight) {
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle[StyleKey.WIDTH];
                }
                else {
                    this.width = 0;
                }
                this.x = data.x + data.w - this.width - computedStyle[StyleKey.RIGHT];
            }
            else {
                this.x = data.x;
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle[StyleKey.WIDTH];
                }
                else {
                    this.width = 0;
                }
            }
            // 上下决定y+height
            if (fixedTop && fixedBottom) {
                this.y = data.y + computedStyle[StyleKey.TOP];
                this.height = data.h - computedStyle[StyleKey.TOP] - computedStyle[StyleKey.BOTTOM];
            }
            else if (fixedTop) {
                this.y = data.y + computedStyle[StyleKey.TOP];
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle[StyleKey.HEIGHT];
                }
                else {
                    this.height = 0;
                }
            }
            else if (fixedBottom) {
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle[StyleKey.HEIGHT];
                }
                else {
                    this.height = 0;
                }
                this.y = data.y + data.h - this.height - computedStyle[StyleKey.BOTTOM];
            }
            else {
                this.y = data.y;
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle[StyleKey.HEIGHT];
                }
                else {
                    this.height = 0;
                }
            }
        }
        // 布局前计算需要在布局阶段知道的样式，且必须是最终像素值之类，不能是百分比等原始值
        calReflowStyle() {
            const { style, computedStyle, parent } = this;
            computedStyle[StyleKey.FONT_FAMILY] = style[StyleKey.FONT_FAMILY].v.split(',');
            computedStyle[StyleKey.FONT_SIZE] = style[StyleKey.FONT_STYLE].v;
            computedStyle[StyleKey.FONT_WEIGHT] = style[StyleKey.FONT_WEIGHT].v;
            computedStyle[StyleKey.FONT_STYLE] = style[StyleKey.FONT_STYLE].v;
            const lineHeight = style[StyleKey.LINE_HEIGHT];
            if (lineHeight.u === StyleUnit.AUTO) ;
            else {
                computedStyle[StyleKey.LINE_HEIGHT] = lineHeight.v;
            }
            this.width = this.height = 0;
            const width = style[StyleKey.WIDTH];
            const height = style[StyleKey.HEIGHT];
            if (parent) {
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle[StyleKey.WIDTH] = this.calSize(width, parent.width);
                }
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle[StyleKey.HEIGHT] = this.calSize(height, parent.height);
                }
            }
        }
        calRepaintStyle() {
            const { style, computedStyle } = this;
            computedStyle[StyleKey.VISIBLE] = style[StyleKey.VISIBLE].v;
            computedStyle[StyleKey.OVERFLOW] = style[StyleKey.OVERFLOW].v;
            computedStyle[StyleKey.OPACITY] = style[StyleKey.OPACITY].v;
            computedStyle[StyleKey.MIX_BLEND_MODE] = style[StyleKey.MIX_BLEND_MODE].v;
            this.calMatrix(RefreshLevel.REFLOW);
        }
        calMatrix(lv) {
            const { style, computedStyle, matrix, transform } = this;
            let optimize = true;
            if (lv >= RefreshLevel.REFLOW
                || lv & RefreshLevel.TRANSFORM
                || (lv & RefreshLevel.SCALE_X) && !computedStyle[StyleKey.SCALE_X]
                || (lv & RefreshLevel.SCALE_Y) && !computedStyle[StyleKey.SCALE_Y]) {
                optimize = false;
            }
            // 优化计算scale不能为0，无法计算倍数差，rotateZ优化不能包含rotateX/rotateY/skew
            if (optimize) {
                if (lv & RefreshLevel.TRANSLATE_X) {
                    const v = this.calSize(style[StyleKey.TRANSLATE_X], this.width);
                    const diff = v - computedStyle[StyleKey.TRANSLATE_X];
                    computedStyle[StyleKey.TRANSLATE_X] = v;
                    transform[12] += diff;
                    matrix[12] += diff;
                }
                if (lv & RefreshLevel.TRANSLATE_Y) {
                    const v = this.calSize(style[StyleKey.TRANSLATE_Y], this.height);
                    const diff = v - computedStyle[StyleKey.TRANSLATE_Y];
                    computedStyle[StyleKey.TRANSLATE_Y] = v;
                    transform[13] += diff;
                    matrix[13] += diff;
                }
                if (lv & RefreshLevel.ROTATE_Z) {
                    const v = style[StyleKey.ROTATE_Z].v;
                    computedStyle[StyleKey.ROTATE_Z] = v;
                    const r = d2r(v);
                    const sin = Math.sin(r), cos = Math.cos(r);
                    const x = computedStyle[StyleKey.SCALE_X], y = computedStyle[StyleKey.SCALE_Y];
                    const cx = matrix[0] = cos * x;
                    const sx = matrix[1] = sin * x;
                    const sy = matrix[4] = -sin * y;
                    const cy = matrix[5] = cos * y;
                    const t = computedStyle[StyleKey.TRANSFORM_ORIGIN], ox = t[0] + this.x, oy = t[1] + this.y;
                    matrix[12] = transform[12] + ox - cx * ox - oy * sy;
                    matrix[13] = transform[13] + oy - sx * ox - oy * cy;
                }
                if (lv & RefreshLevel.SCALE) {
                    if (lv & RefreshLevel.SCALE_X) {
                        const v = style[StyleKey.SCALE_X].v;
                        let x = v / computedStyle[StyleKey.SCALE_X];
                        computedStyle[StyleKey.SCALE_X] = v;
                        transform[0] *= x;
                        transform[1] *= x;
                        transform[2] *= x;
                        matrix[0] *= x;
                        matrix[1] *= x;
                        matrix[2] *= x;
                    }
                    if (lv & RefreshLevel.SCALE_Y) {
                        const v = style[StyleKey.SCALE_Y].v;
                        let y = v / computedStyle[StyleKey.SCALE_Y];
                        computedStyle[StyleKey.SCALE_Y] = v;
                        transform[4] *= y;
                        transform[5] *= y;
                        transform[6] *= y;
                        matrix[4] *= y;
                        matrix[5] *= y;
                        matrix[6] *= y;
                    }
                    const t = computedStyle[StyleKey.TRANSFORM_ORIGIN], ox = t[0] + this.x, oy = t[1] + this.y;
                    matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
                    matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
                    matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
                }
            }
            // 普通布局或者第一次计算
            else {
                transform[12] = computedStyle[StyleKey.TRANSLATE_X] = this.calSize(style[StyleKey.TRANSLATE_X], this.width);
                transform[13] = computedStyle[StyleKey.TRANSLATE_Y] = this.calSize(style[StyleKey.TRANSLATE_Y], this.width);
                const rotateZ = computedStyle[StyleKey.ROTATE_Z] = style[StyleKey.ROTATE_Z].v;
                if (isE(transform)) {
                    calRotateZ(transform, rotateZ);
                }
                else {
                    multiplyRotateZ(transform, d2r(rotateZ));
                }
                const scaleX = computedStyle[StyleKey.SCALE_X] = style[StyleKey.SCALE_X].v;
                if (scaleX !== 1) {
                    if (isE(transform)) {
                        transform[0] = scaleX;
                    }
                    else {
                        multiplyScaleX(transform, scaleX);
                    }
                }
                const scaleY = computedStyle[StyleKey.SCALE_Y] = style[StyleKey.SCALE_Y].v;
                if (scaleY !== 1) {
                    if (isE(transform)) {
                        transform[5] = scaleY;
                    }
                    else {
                        multiplyScaleY(transform, scaleY);
                    }
                }
                const tfo = computedStyle[StyleKey.TRANSFORM_ORIGIN] = style[StyleKey.TRANSFORM_ORIGIN].map((item, i) => {
                    return this.calSize(item, i ? this.height : this.width);
                });
                const t = calMatrixByOrigin(transform, tfo[0] + this.x, tfo[1] + this.y);
                assignMatrix(matrix, t);
            }
        }
        calSize(v, p) {
            if (v.u === StyleUnit.PX) {
                return v.v;
            }
            if (v.u === StyleUnit.PERCENT) {
                return v.v * p * 0.01;
            }
            return 0;
        }
        calContent() {
            const { computedStyle } = this;
            if (!computedStyle[StyleKey.VISIBLE]) {
                return this.hasContent = false;
            }
            const backgroundColor = computedStyle[StyleKey.BACKGROUND_COLOR];
            if (backgroundColor && backgroundColor[3] > 0) {
                return this.hasContent = true;
            }
            return this.hasContent = false;
        }
        renderCanvas(ctx, dx = 0, dy = 0) {
            if (this.canvasCache) {
                this.canvasCache.release();
            }
        }
        genTexture(gl) {
        }
        remove(cb) {
            const { root, parent } = this;
            if (!root) {
                return;
            }
            if (root === this) {
                return;
            }
            if (parent) {
                let i = parent.children.indexOf(this);
                if (i === -1) {
                    throw new Error('Invalid index of remove()');
                }
                parent.children.splice(i, 1);
                const { prev, next } = this;
                if (prev) {
                    prev.next = next;
                }
                if (next) {
                    next.prev = prev;
                }
            }
            // 未添加到dom时
            if (this.isDestroyed) {
                cb && cb();
                return;
            }
            parent.deleteStruct(this);
        }
        destroy() {
            if (this.isDestroyed) {
                return;
            }
            this.isDestroyed = true;
            this.prev = this.next = this.parent = this.root = undefined;
        }
        structure(lv) {
            const temp = this.struct;
            temp.lv = lv;
            return [temp];
        }
        updateStyle(style, cb) {
            const visible = this.computedStyle[StyleKey.VISIBLE];
            let hasVisible = false;
            const keys = [];
            const style2 = normalizeStyle(style);
            for (let k in style2) {
                if (style2.hasOwnProperty(k)) {
                    const k2 = parseInt(k);
                    const v = style2[k2];
                    if (!equalStyle(k2, style2, this.style)) {
                        this.style[k2] = v;
                        keys.push(k2);
                        if (k2 === StyleKey.VISIBLE) {
                            hasVisible = true;
                        }
                    }
                }
            }
            // 不可见或销毁无需刷新
            if (!keys.length || this.isDestroyed || !visible && !hasVisible) {
                cb && cb(true);
                return;
            }
            // 父级不可见无需刷新
            let parent = this.parent;
            while (parent) {
                if (!parent.computedStyle[StyleKey.VISIBLE]) {
                    cb && cb(true);
                    return;
                }
                parent = parent.parent;
            }
            this.root.addUpdate(this, keys, undefined, false, false, false, cb);
        }
        getComputedStyle() {
            return this.computedStyle;
        }
        getStyle(key) {
        }
        get bbox() {
            if (!this._bbox) {
                this._bbox = new Float64Array(4);
                this._bbox[0] = this.x;
                this._bbox[1] = this.y;
                this._bbox[2] = this.x + this.width;
                this._bbox[3] = this.y + this.height;
            }
            return this._bbox;
        }
        get outerBbox() {
            if (!this._filterBbox) {
                let bbox = this._bbox || this.bbox;
                this._filterBbox = bbox.slice(0);
            }
            return this._filterBbox;
        }
    }

    const SPF = 1000 / 60;
    const CANVAS = {};
    function offscreenCanvas(width, height, key, contextAttributes) {
        let o;
        if (!key) {
            o = document.createElement('canvas');
        }
        else if (!CANVAS[key]) {
            o = CANVAS[key] = document.createElement('canvas');
        }
        else {
            o = CANVAS[key];
        }
        // 防止小数向上取整
        width = Math.ceil(width);
        height = Math.ceil(height);
        o.width = width;
        o.height = height;
        {
            o.style.width = width + 'px';
            o.style.height = height + 'px';
            if (key) {
                o.setAttribute('key', key);
            }
            document.body.appendChild(o);
        }
        let ctx = o.getContext('2d', contextAttributes);
        if (!ctx) {
            inject.error('Total canvas memory use exceeds the maximum limit');
        }
        return {
            canvas: o,
            ctx,
            enabled: true,
            available: true,
            release() {
                ctx.globalAlpha = 1;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, width, height);
                o.width = o.height = 0;
                this.available = false;
                if (o) {
                    document.body.removeChild(o);
                }
                o = null;
            },
        };
    }
    const SUPPORT_FONT = {};
    let defaultFontFamilyData;
    const IMG = {};
    const INIT = 0;
    const LOADING = 1;
    const LOADED = 2;
    const FONT = {};
    let MAX_LOAD_NUM = 0;
    let imgCount = 0, imgQueue = [], fontCount = 0, fontQueue = [];
    const inject = {
        requestAnimationFrame(cb) {
            if (!cb) {
                return -1;
            }
            let res;
            if (typeof requestAnimationFrame !== 'undefined') {
                inject.requestAnimationFrame = requestAnimationFrame.bind(null);
                res = requestAnimationFrame(cb);
            }
            else {
                res = setTimeout(cb, SPF);
                inject.requestAnimationFrame = function (cb) {
                    return setTimeout(cb, SPF);
                };
            }
            return res;
        },
        cancelAnimationFrame(id) {
            let res;
            if (typeof cancelAnimationFrame !== 'undefined') {
                inject.cancelAnimationFrame = cancelAnimationFrame.bind(null);
                res = cancelAnimationFrame(id);
            }
            else {
                res = clearTimeout(id);
                inject.cancelAnimationFrame = function (id) {
                    return clearTimeout(id);
                };
            }
            return res;
        },
        now() {
            if (typeof performance !== 'undefined') {
                inject.now = function () {
                    return Math.floor(performance.now());
                };
                return Math.floor(performance.now());
            }
            inject.now = Date.now.bind(Date);
            return Date.now();
        },
        hasOffscreenCanvas(key) {
            return key && CANVAS.hasOwnProperty(key);
        },
        getOffscreenCanvas(width, height, key, contextAttributes) {
            return offscreenCanvas(width, height, key, contextAttributes);
        },
        isWebGLTexture(o) {
            if (o && typeof WebGLTexture !== 'undefined') {
                return o instanceof WebGLTexture;
            }
        },
        defaultFontFamily: 'arial',
        getFontCanvas(contextAttributes) {
            return inject.getOffscreenCanvas(16, 16, '__$$CHECK_SUPPORT_FONT_FAMILY$$__', contextAttributes);
        },
        checkSupportFontFamily(ff) {
            ff = ff.toLowerCase();
            // 强制arial兜底
            if (ff === this.defaultFontFamily) {
                return true;
            }
            if (SUPPORT_FONT.hasOwnProperty(ff)) {
                return SUPPORT_FONT[ff];
            }
            let canvas = inject.getFontCanvas({ willReadFrequently: true });
            let context = canvas.ctx;
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.textBaseline = 'middle';
            if (!defaultFontFamilyData) {
                context.clearRect(0, 0, 16, 16);
                context.font = '16px ' + this.defaultFontFamily;
                context.fillText('a', 8, 8);
                defaultFontFamilyData = context.getImageData(0, 0, 16, 16).data;
            }
            context.clearRect(0, 0, 16, 16);
            if (/\s/.test(ff)) {
                ff = '"' + ff.replace(/"/g, '\\"') + '"';
            }
            context.font = '16px ' + ff + ',' + this.defaultFontFamily;
            context.fillText('a', 8, 8);
            let data = context.getImageData(0, 0, 16, 16).data;
            for (let i = 0, len = data.length; i < len; i++) {
                if (defaultFontFamilyData[i] !== data[i]) {
                    return SUPPORT_FONT[ff] = true;
                }
            }
            return SUPPORT_FONT[ff] = false;
        },
        FONT,
        loadFont(fontFamily, url, cb) {
            if (isFunction(url)) {
                // @ts-ignore
                cb = url;
                url = fontFamily;
            }
            if (Array.isArray(url)) {
                if (!url.length) {
                    return cb && cb();
                }
                let count = 0;
                let len = url.length;
                let list = [];
                url.forEach((item, i) => {
                    inject.loadFont(item.fontFamily, item.url, function (cache) {
                        list[i] = cache;
                        if (++count === len) {
                            cb && cb(list);
                        }
                    });
                });
                return;
            }
            else if (!url || !isString(url)) {
                inject.error('Load font invalid: ' + url);
                cb && cb({
                    state: LOADED,
                    success: false,
                    url,
                });
                return;
            }
            let cache = FONT[url] = FONT[url] || {
                state: INIT,
                task: [],
            };
            if (cache.state === LOADED) {
                cb && cb(cache);
            }
            else if (cache.state === LOADING) {
                cb && cache.task.push(cb);
            }
            else {
                cache.state = LOADING;
                cb && cache.task.push(cb);
                if (MAX_LOAD_NUM > 0 && fontCount >= MAX_LOAD_NUM) {
                    fontQueue.push({
                        fontFamily,
                        url,
                    });
                    return;
                }
                fontCount++;
                function load(fontFamily, url, cache) {
                    if (url instanceof ArrayBuffer) {
                        success(url);
                    }
                    else {
                        let request = new XMLHttpRequest();
                        request.open('get', url, true);
                        request.responseType = 'arraybuffer';
                        request.onload = function () {
                            if (request.response) {
                                success(request.response);
                            }
                            else {
                                error();
                            }
                        };
                        request.onerror = error;
                        request.send();
                    }
                    function success(ab) {
                        let f = new FontFace(fontFamily, ab);
                        f.load().then(function () {
                            if (typeof document !== 'undefined') {
                                document.fonts.add(f);
                            }
                            cache.state = LOADED;
                            cache.success = true;
                            cache.url = url;
                            let list = cache.task.splice(0);
                            list.forEach((cb) => cb(cache, ab));
                        }).catch(error);
                        fontCount++;
                        if (fontQueue.length) {
                            let o = fontQueue.shift();
                            load(o.fontFamily, o.url, FONT[o.url]);
                        }
                    }
                    function error() {
                        cache.state = LOADED;
                        cache.success = false;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => cb(cache));
                        fontCount--;
                        if (fontQueue.length) {
                            let o = fontQueue.shift();
                            load(o.fontFamily, o.url, FONT[o.url]);
                        }
                    }
                }
                load(fontFamily, url, cache);
            }
        },
        IMG,
        INIT,
        LOADED,
        LOADING,
        get MAX_LOAD_NUM() {
            return MAX_LOAD_NUM;
        },
        set MAX_LOAD_NUM(v) {
            // @ts-ignore
            MAX_LOAD_NUM = parseInt(v) || 0;
        },
        measureImg(url, cb) {
            if (Array.isArray(url)) {
                if (!url.length) {
                    return cb && cb();
                }
                let count = 0;
                let len = url.length;
                let list = [];
                url.forEach((item, i) => {
                    inject.measureImg(item, function (cache) {
                        list[i] = cache;
                        if (++count === len) {
                            cb && cb(list);
                        }
                    });
                });
                return;
            }
            else if (!url || !isString(url)) {
                inject.error('Measure img invalid: ' + url);
                cb && cb({
                    state: LOADED,
                    success: false,
                    url,
                });
                return;
            }
            let cache = IMG[url] = IMG[url] || {
                state: INIT,
                task: [],
            };
            if (cache.state === LOADED) {
                cb && cb(cache);
            }
            else if (cache.state === LOADING) {
                cb && cache.task.push(cb);
            }
            else {
                cache.state = LOADING;
                cb && cache.task.push(cb);
                if (MAX_LOAD_NUM > 0 && imgCount >= MAX_LOAD_NUM) {
                    imgQueue.push(url);
                    return;
                }
                imgCount++;
                function load(url, cache) {
                    let img = new Image();
                    img.onload = function () {
                        cache.state = LOADED;
                        cache.success = true;
                        cache.width = img.width;
                        cache.height = img.height;
                        cache.source = img;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => {
                            cb(cache);
                        });
                        imgCount--;
                        if (imgQueue.length) {
                            let o = imgQueue.shift();
                            load(o, IMG[o]);
                        }
                    };
                    img.onerror = function (e) {
                        cache.state = LOADED;
                        cache.success = false;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => cb(cache));
                        imgCount--;
                        if (imgQueue.length) {
                            let o = imgQueue.shift();
                            load(o, cache);
                        }
                    };
                    if (url.substr(0, 5) !== 'data:') {
                        let host = /^(?:\w+:)?\/\/([^/:]+)/.exec(url);
                        if (host) {
                            if (typeof location === 'undefined' || location.hostname !== host[1]) {
                                img.crossOrigin = 'anonymous';
                            }
                        }
                    }
                    img.src = url;
                    if (typeof document !== 'undefined') {
                        document.body.appendChild(img);
                    }
                }
                load(url, cache);
            }
        },
        log(s) {
            console.log(s);
        },
        warn(s) {
            console.warn(s);
        },
        error(s) {
            console.error(s);
        },
    };

    class Container extends Node {
        constructor(name, props, children) {
            super(name, props);
            this.children = children;
        }
        didMount() {
            super.didMount();
            const { children } = this;
            const len = children.length;
            if (len) {
                const first = children[0];
                first.parent = this;
                first.didMount();
                let last = first;
                for (let i = 1; i < len; i++) {
                    const child = children[i];
                    child.parent = this;
                    child.didMount();
                    last.next = child;
                    child.prev = last;
                    last = child;
                }
            }
        }
        layout(container, data) {
            if (this.isDestroyed) {
                return;
            }
            super.layout(container, data);
            const { children } = this;
            for (let i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                child.layout(this, {
                    x: this.x,
                    y: this.y,
                    w: this.width,
                    h: this.height,
                });
            }
        }
        appendChild(node, cb) {
            const { root, children } = this;
            const len = children.length;
            if (len) {
                const last = children[children.length - 1];
                last.next = node;
                node.prev = last;
            }
            node.parent = this;
            node.root = root;
            children.push(node);
            // 离屏情况，尚未添加到dom等
            if (this.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            this.insertStruct(node, len);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, undefined);
        }
        prependChild(node, cb) {
            const { root, children } = this;
            const len = children.length;
            if (len) {
                const first = children[0];
                first.next = node;
                node.prev = first;
            }
            node.parent = this;
            node.root = root;
            children.push(node);
            // 离屏情况，尚未添加到dom等
            if (this.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            this.insertStruct(node, 0);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, undefined);
        }
        removeChild(node, cb) {
            if (node.parent === this) {
                node.remove(cb);
            }
            else {
                inject.error('Invalid parameter of removeChild()');
            }
        }
        destroy() {
            const { isDestroyed, children } = this;
            if (isDestroyed) {
                return;
            }
            for (let i = 0, len = children.length; i < len; i++) {
                children[i].destroy();
            }
            super.destroy();
        }
        structure(lv) {
            let res = super.structure(lv);
            this.children.forEach(child => {
                res = res.concat(child.structure(lv + 1));
            });
            res[0].num = this.children.length;
            res[0].total = res.length - 1;
            return res;
        }
        insertStruct(child, childIndex) {
            const { struct, root } = this;
            const cs = child.structure(struct.lv + 1);
            const structs = root.structs;
            let i;
            if (childIndex) {
                const s = this.children[childIndex - 1].struct;
                const total = s.total;
                i = structs.indexOf(s) + total + 1;
            }
            else {
                i = structs.indexOf(struct) + 1;
            }
            structs.splice(i, 0, ...cs);
            const total = cs[0].total + 1;
            struct.num++;
            struct.total += total;
            let p = this.parent;
            while (p) {
                p.struct.total += total;
                p = p.parent;
            }
        }
        deleteStruct(child) {
            const cs = child.struct;
            const total = cs.total + 1;
            const root = this.root, structs = root.structs;
            const i = structs.indexOf(cs);
            structs.splice(i, total);
            const struct = this.struct;
            struct.num--;
            struct.total -= total;
            let p = this.parent;
            while (p) {
                p.struct.total -= total;
                p = p.parent;
            }
        }
    }

    // import { LayoutData, mergeBbox, resetBbox, assignBbox } from '../node/layout';
    class Group extends Container {
        constructor(name, props, children) {
            super(name, props, children);
            this.children = children;
        }
    }

    function createTexture(gl, n, tex, width, height) {
        let texture = gl.createTexture();
        bindTexture(gl, texture, n);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        // 传入需要绑定的纹理
        if (tex) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
        }
        // 或者尺寸来绑定fbo
        else if (width && height) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        else {
            throw new Error('Missing texImageSource or w/h');
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return texture;
    }
    function bindTexture(gl, texture, n) {
        // @ts-ignore
        gl.activeTexture(gl['TEXTURE' + n]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    function drawTextureCache(gl, cx, cy, programs, list, vertCount) {
        if (!list.length || !vertCount) {
            return;
        }
        const vtPoint = new Float32Array(vertCount * 12);
        const vtTex = new Float32Array(vertCount * 12);
        const vtOpacity = new Float32Array(vertCount * 6);
        for (let i = 0, len = list.length; i < len; i++) {
            const { node, opacity, matrix, cache } = list[i];
            const { texture, ratioX, ratioY } = cache;
            bindTexture(gl, texture, 0);
            const { x, y, width, height } = node;
            let x1 = x * ratioX, y1 = y * ratioY;
            const t = calRectPoint(x1, y1, x1 + width * ratioX, y1 + height * ratioY, matrix);
            const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy);
            const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy);
            const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy);
            const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy);
            let k = i * 12;
            vtPoint[k] = t1.x;
            vtPoint[k + 1] = t1.y;
            vtPoint[k + 2] = t4.x;
            vtPoint[k + 3] = t4.y;
            vtPoint[k + 4] = t2.x;
            vtPoint[k + 5] = t2.y;
            vtPoint[k + 6] = t4.x;
            vtPoint[k + 7] = t4.y;
            vtPoint[k + 8] = t2.x;
            vtPoint[k + 9] = t2.y;
            vtPoint[k + 10] = t3.x;
            vtPoint[k + 11] = t3.y;
            vtTex[k] = 0;
            vtTex[k + 1] = 0;
            vtTex[k + 2] = 0;
            vtTex[k + 3] = 1;
            vtTex[k + 4] = 1;
            vtTex[k + 5] = 0;
            vtTex[k + 6] = 0;
            vtTex[k + 7] = 1;
            vtTex[k + 8] = 1;
            vtTex[k + 9] = 0;
            vtTex[k + 10] = 1;
            vtTex[k + 11] = 1;
            k = i * 6;
            vtOpacity[k] = opacity;
            vtOpacity[k + 1] = opacity;
            vtOpacity[k + 2] = opacity;
            vtOpacity[k + 3] = opacity;
            vtOpacity[k + 4] = opacity;
            vtOpacity[k + 5] = opacity;
        }
        // 顶点buffer
        const pointBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
        const a_position = gl.getAttribLocation(programs.program, 'a_position');
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);
        // 纹理buffer
        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
        let a_texCoords = gl.getAttribLocation(programs.program, 'a_texCoords');
        gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoords);
        // opacity buffer
        const opacityBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, opacityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtOpacity, gl.STATIC_DRAW);
        const a_opacity = gl.getAttribLocation(programs.program, 'a_opacity');
        gl.vertexAttribPointer(a_opacity, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_opacity);
        // 纹理单元
        let u_texture = gl.getUniformLocation(programs.program, 'u_texture');
        gl.uniform1i(u_texture, 0);
        // 渲染并销毁
        gl.drawArrays(gl.TRIANGLES, 0, vertCount * 6);
        gl.deleteBuffer(pointBuffer);
        gl.deleteBuffer(texBuffer);
        gl.deleteBuffer(opacityBuffer);
        gl.disableVertexAttribArray(a_position);
        gl.disableVertexAttribArray(a_texCoords);
        gl.disableVertexAttribArray(a_opacity);
    }
    function convertCoords2Gl(x, y, cx, cy) {
        if (x === cx) {
            x = 0;
        }
        else {
            x = (x - cx) / cx;
        }
        if (y === cy) {
            y = 0;
        }
        else {
            y = (cy - y) / cy;
        }
        return { x, y };
    }

    const HASH$1 = {};
    class TextureCache {
        constructor(texture, ratioX, ratioY) {
            this.ratioX = ratioX;
            this.ratioY = ratioY;
            this.texture = texture;
        }
        static getInstance(gl, node) {
            const { offscreen } = node.canvasCache;
            const texture = createTexture(gl, 0, offscreen.canvas);
            return new TextureCache(texture, 1, 1);
        }
        static getImgInstance(gl, node, ratioX = 1, ratioY = 1) {
            if (!node.loader.onlyImg) {
                throw new Error('Need an onlyImg');
            }
            const url = node.src;
            if (HASH$1.hasOwnProperty(url)) {
                const o = HASH$1[url];
                o.count++;
                return new TextureCache(HASH$1[url].value, ratioX, ratioY);
            }
            const { offscreen } = node.canvasCache;
            const texture = createTexture(gl, 0, offscreen.canvas);
            HASH$1[url] = {
                value: texture,
                count: 1,
            };
            return new TextureCache(texture, ratioX, ratioY);
        }
    }

    class Bitmap extends Node {
        constructor(name, props) {
            super(name, props);
            const src = this.src = props.src;
            this.loader = {
                error: false,
                loading: false,
                src,
                width: 0,
                height: 0,
                onlyImg: true,
            };
            if (!src) {
                this.loader.error = true;
            }
            else {
                const cache = inject.IMG[src];
                if (!cache) {
                    inject.measureImg(src, (res) => {
                        // 可能会变更，所以加载完后对比下是不是当前最新的
                        if (src === this.loader.src) {
                            if (res.success) {
                                if (isFunction(props.onLoad)) {
                                    props.onLoad();
                                }
                            }
                            else {
                                if (isFunction(props.onError)) {
                                    props.onError();
                                }
                            }
                        }
                    });
                }
                else if (cache.state === inject.LOADED) {
                    if (cache.success) {
                        this.loader.source = cache.source;
                        this.loader.width = cache.source.width;
                        this.loader.height = cache.source.height;
                    }
                    else {
                        this.loader.error = true;
                    }
                }
            }
        }
        layout(container, data) {
            super.layout(container, data);
            const src = this.loader.src;
            if (src) {
                const cache = inject.IMG[src];
                if (!cache || cache.state === inject.LOADING) {
                    if (!this.loader.loading) {
                        this.loadAndRefresh();
                    }
                }
                else if (cache && cache.state === inject.LOADED) {
                    this.loader.loading = false;
                    if (cache.success) {
                        this.loader.source = cache.source;
                        this.loader.width = cache.width;
                        this.loader.height = cache.height;
                    }
                    else {
                        this.loader.error = true;
                    }
                }
            }
        }
        loadAndRefresh() {
            // 加载前先清空之前可能遗留的老数据
            const loader = this.loader;
            loader.source = undefined;
            loader.error = false;
            loader.loading = true;
            inject.measureImg(loader.src, (data) => {
                // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
                if (data.url === loader.src) {
                    loader.loading = false;
                    if (data.success) {
                        loader.source = data.source;
                        loader.width = data.width;
                        loader.height = data.height;
                        if (!this.isDestroyed) {
                            this.root.addUpdate(this, [], RefreshLevel.REPAINT, false, false, false, undefined);
                        }
                    }
                    else {
                        loader.error = true;
                    }
                }
            });
        }
        calContent() {
            let res = super.calContent();
            const { computedStyle, loader } = this;
            if (res) {
                loader.onlyImg = false;
            }
            else {
                loader.onlyImg = true;
                const { [StyleKey.VISIBLE]: visible, } = computedStyle;
                if (visible) {
                    if (loader.source) {
                        res = true;
                    }
                }
            }
            return this.hasContent = res;
        }
        renderCanvas(ctx, dx = 0, dy = 0) {
            super.renderCanvas(ctx, dx, dy);
        }
        genTexture(gl) {
            const { outerBbox, loader } = this;
            if (loader.onlyImg) {
                const w = outerBbox[2] - outerBbox[0];
                const h = outerBbox[3] - outerBbox[1];
                this.textureCache = TextureCache.getImgInstance(gl, this, w / loader.width, h / loader.height);
            }
            else {
                this.textureCache = TextureCache.getInstance(gl, this);
            }
        }
    }

    class Text extends Node {
        constructor(name, props) {
            super(name, props);
        }
    }

    class ArtBoard extends Container {
        constructor(name, props, children) {
            super(name, props, children);
        }
    }

    class Geom extends Node {
        constructor(name, props) {
            super(name, props);
        }
    }

    class Rect extends Geom {
        constructor(name, props) {
            super(name, props);
        }
    }

    function parse$1(json) {
        if (json.type === classValue.ArtBoard) {
            const children = [];
            for (let i = 0, len = json.children.length; i < len; i++) {
                const res = parse$1(json.children[i]);
                if (res) {
                    children.push(res);
                }
            }
            return new ArtBoard(json.name, json.props, children);
        }
        else if (json.type === classValue.Group) {
            const children = [];
            for (let i = 0, len = json.children.length; i < len; i++) {
                const res = parse$1(json.children[i]);
                if (res) {
                    children.push(res);
                }
            }
            return new Group(json.name, json.props, children);
        }
        else if (json.type === classValue.Bitmap) {
            return new Bitmap(json.name, json.props);
        }
        else if (json.type === classValue.Text) {
            return new Text(json.name, json.props);
        }
        else if (json.type === classValue.Rect) {
            return new Rect(json.name, json.props);
        }
    }
    class Page extends Container {
        constructor(name, props, children) {
            super(name, props, children);
        }
        initIfNot() {
            if (this.json) {
                for (let i = 0, len = this.json.children.length; i < len; i++) {
                    const res = parse$1(this.json.children[i]);
                    if (res) {
                        this.appendChild(res);
                    }
                }
                this.json = undefined;
            }
        }
    }

    class CanvasCache {
        constructor(w, h, dx, dy) {
            this.offscreen = inject.getOffscreenCanvas(w, h);
            this.w = w;
            this.h = h;
            this.dx = dx;
            this.dy = dy;
        }
        release() {
            this.offscreen.release();
        }
        static getInstance(w, h, dx, dy) {
            return new CanvasCache(w, h, dx, dy);
        }
    }

    const HASH = {};
    // @ts-ignore
    class ImgCanvasCache extends CanvasCache {
        constructor(w, h, dx, dy, url) {
            super(w, h, dx, dy);
            this.url = url;
        }
        release() {
            const o = HASH[this.url];
            o.count--;
            if (!o.count) {
                super.release();
                delete HASH[this.url];
            }
        }
        get count() {
            return HASH[this.url].count;
        }
        static getInstance(w, h, dx, dy, url) {
            if (HASH.hasOwnProperty(url)) {
                const o = HASH[url];
                o.count++;
                return o.value;
            }
            const o = new ImgCanvasCache(w, h, dx, dy, url);
            HASH[url] = {
                value: o,
                count: 1,
            };
            return o;
        }
    }

    function renderWebgl(gl, root, rl) {
        const { structs, width, height } = root;
        const cx = width * 0.5, cy = height * 0.5;
        // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
        if (rl >= RefreshLevel.REPAINT) {
            for (let i = 0, len = structs.length; i < len; i++) {
                const { node } = structs[i];
                const { refreshLevel } = node;
                node.refreshLevel = RefreshLevel.NONE;
                // 无任何变化即refreshLevel为NONE（0）忽略
                if (refreshLevel) {
                    // filter之类的变更
                    if (refreshLevel < RefreshLevel.REPAINT) ;
                    else {
                        const hasContent = node.calContent();
                        // 有内容先以canvas模式绘制到离屏画布上
                        if (hasContent) {
                            if (node instanceof Bitmap) {
                                const loader = node.loader;
                                // 肯定有source，因为hasContent预防过，这里判断特殊的纯位图，要共享源节省内存
                                if (loader.onlyImg) {
                                    const canvasCache = node.canvasCache = ImgCanvasCache.getInstance(loader.width, loader.height, -node.x, -node.y, node.src);
                                    // 第一张图像才绘制，图片解码到canvas上
                                    if (canvasCache.count === 1) {
                                        canvasCache.offscreen.ctx.drawImage(loader.source, 0, 0);
                                    }
                                    node.genTexture(gl);
                                }
                            }
                        }
                    }
                }
            }
        }
        // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
        const programs = root.programs;
        for (let i = 0, len = structs.length; i < len; i++) {
            const { node, total } = structs[i];
            const computedStyle = node.computedStyle;
            if (!computedStyle[StyleKey.VISIBLE]) {
                i += total;
                continue;
            }
            // 继承父的opacity和matrix
            let opacity = computedStyle[StyleKey.OPACITY];
            let matrix = node.matrix;
            const parent = node.parent;
            if (parent) {
                const op = parent.opacity, mw = parent.matrixWorld;
                if (op !== 1) {
                    opacity *= op;
                }
                matrix = multiply(mw, matrix);
            }
            node.opacity = opacity;
            assignMatrix(node.matrixWorld, matrix);
            // 一般只有一个纹理
            const textureCache = node.textureCache;
            if (textureCache && opacity > 0) {
                drawTextureCache(gl, cx, cy, programs, [{
                        node,
                        opacity,
                        matrix,
                        cache: textureCache,
                    }], 1);
            }
        }
    }

    let isPause;
    function traversalBefore(list, length, diff) {
        for (let i = 0; i < length; i++) {
            let item = list[i];
            item.before && item.before(diff);
        }
    }
    function traversalAfter(list, length, diff) {
        for (let i = 0; i < length; i++) {
            let item = list[i];
            item.after(diff);
        }
    }
    class Frame {
        constructor() {
            this.rootTask = [];
            this.roots = [];
            this.task = [];
            this.now = inject.now();
            this.id = 0;
        }
        init() {
            let self = this;
            let { task } = self;
            inject.cancelAnimationFrame(self.id);
            let last = self.now = inject.now();
            function cb() {
                // 必须清除，可能会发生重复，当动画finish回调中gotoAndPlay(0)，下方结束判断发现aTask还有值会继续，新的init也会进入再次执行
                inject.cancelAnimationFrame(self.id);
                self.id = inject.requestAnimationFrame(function () {
                    // console.log('frame', task.length, task.slice(0))
                    let now = self.now = inject.now();
                    if (isPause || !task.length) {
                        return;
                    }
                    let diff = now - last;
                    diff = Math.max(diff, 0);
                    // let delta = diff * 0.06; // 比例是除以1/60s，等同于*0.06
                    last = now;
                    // 优先动画计算
                    let clone = task.slice(0);
                    let len1 = clone.length;
                    // 普通的before/after，动画计算在before，所有回调在after
                    traversalBefore(clone, len1, diff);
                    // 刷新成功后调用after，确保图像生成
                    traversalAfter(clone, len1, diff);
                    // 还有则继续，没有则停止节省性能
                    if (task.length) {
                        cb();
                    }
                });
            }
            cb();
        }
        onFrame(handle) {
            if (!handle) {
                return;
            }
            let { task } = this;
            if (!task.length) {
                this.init();
            }
            if (isFunction(handle)) {
                handle = {
                    after: handle,
                    ref: handle,
                };
            }
            task.push(handle);
        }
        offFrame(handle) {
            if (!handle) {
                return;
            }
            let { task } = this;
            for (let i = 0, len = task.length; i < len; i++) {
                let item = task[i];
                // 需考虑nextFrame包裹的引用对比
                if (item === handle || item.ref === handle) {
                    task.splice(i, 1);
                    break;
                }
            }
            if (!task.length) {
                inject.cancelAnimationFrame(this.id);
                this.now = 0;
            }
        }
        nextFrame(handle) {
            if (!handle) {
                return;
            }
            // 包裹一层会导致添加后删除对比引用删不掉，需保存原有引用进行对比
            let cb = isFunction(handle) ? {
                after: (diff) => {
                    handle(diff);
                    this.offFrame(cb);
                },
            } : {
                before: handle.before,
                after: (diff) => {
                    handle.after && handle.after(diff);
                    this.offFrame(cb);
                },
            };
            cb.ref = handle;
            this.onFrame(cb);
        }
        pause() {
            isPause = true;
        }
        resume() {
            if (isPause) {
                this.init();
                isPause = false;
            }
        }
        addRoot(root) {
            this.roots.push(root);
        }
        removeRoot(root) {
            let i = this.roots.indexOf(root);
            if (i > -1) {
                this.roots.splice(i, 1);
            }
        }
    }
    const frame = new Frame();

    function checkReflow(root, node, addDom, removeDom) {
        let parent = node.parent;
        if (addDom) {
            node.layout(parent, parent.layoutData);
        }
        else if (removeDom) {
            node.destroy();
        }
        // 最上层的group检查影响
        if (parent instanceof Group) {
            while (parent && parent !== root && (parent instanceof Group)) {
                parent = parent.parent;
            }
        }
    }

    function initShaders(gl, vshader, fshader) {
        let program = createProgram(gl, vshader, fshader);
        if (!program) {
            throw new Error('Failed to create program');
        }
        // 要开启透明度，用以绘制透明的图形
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        return program;
    }
    function createProgram(gl, vshader, fshader) {
        // Create shader object
        let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
        let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        // Create a program object
        let program = gl.createProgram();
        if (!program) {
            return null;
        }
        // @ts-ignore
        program.vertexShader = vertexShader;
        // @ts-ignore
        program.fragmentShader = fragmentShader;
        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // Link the program object
        gl.linkProgram(program);
        // Check the result of linking
        let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            let error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            throw new Error('Failed to link program: ' + error);
        }
        return program;
    }
    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    function loadShader(gl, type, source) {
        // Create shader object
        let shader = gl.createShader(type);
        if (shader == null) {
            throw new Error('unable to create shader');
        }
        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);
        // Check the result of compilation
        let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            let error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + error);
        }
        return shader;
    }

    const config = {
        MAX_TEXTURE_SIZE: 2048,
        SMALL_UNIT: 32,
        MAX_NUM: Math.pow(2048 / 32, 2),
        MAX_TEXTURE_UNITS: 8,
        init(maxSize, maxUnits) {
            this.MAX_TEXTURE_SIZE = maxSize;
            this.MAX_NUM = Math.pow(maxSize / this.SMALL_UNIT, 2);
            this.MAX_TEXTURE_UNITS = maxUnits;
        },
    };

    const mainVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
  v_opacity = a_opacity;
}`;
    const mainFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
varying float v_opacity;

uniform sampler2D u_texture;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color * opacity;
}`;
    const colorVert = `#version 100

attribute vec2 a_position;
attribute vec4 a_color;
varying vec4 v_color;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_color = a_color;
  v_opacity = a_opacity;
}`;
    const colorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_color;
varying float v_opacity;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  gl_FragColor = v_color * opacity;
}`;

    const CONTEXT_ATTRIBUTES = {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        depth: true,
        stencil: true,
    };
    let uuid = 0;
    class Root extends Container {
        constructor(canvas, props) {
            super('Root', props, []);
            this.programs = {};
            this.ani = []; // 动画任务，空占位
            this.aniChange = false;
            this.uuid = uuid++;
            this.canvas = canvas;
            // gl的初始化和配置
            this.ctx = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES)
                || canvas.getContext('webgl', CONTEXT_ATTRIBUTES);
            const gl = this.ctx;
            if (!gl) {
                alert('Webgl unsupported!');
                throw new Error('Webgl unsupported!');
            }
            config.init(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
            this.initShaders(gl);
            // 初始化的数据
            this.root = this;
            this.isDestroyed = false;
            this.structs = this.structure(0);
            this.isAsyncDraw = false;
            this.task = [];
            this.taskClone = [];
            this.rl = RefreshLevel.REBUILD;
            // 刷新动画侦听，目前就一个Root
            frame.addRoot(this);
            this.reLayout();
            this.draw();
            // 存所有Page
            this.pageContainer = new Container('pageContainer', {
                style: getDefaultStyle({
                    width: this.width,
                    height: this.height,
                }),
            }, []);
            this.appendChild(this.pageContainer);
            // 存上层的展示工具标尺等
            this.overlayContainer = new Container('overlayContainer', {
                style: getDefaultStyle({
                    width: this.width,
                    height: this.height,
                }),
            }, []);
            this.appendChild(this.overlayContainer);
        }
        initShaders(gl) {
            const program = this.programs.program = initShaders(gl, mainVert, mainFrag);
            this.programs.colorProgram = initShaders(gl, colorVert, colorFrag);
            gl.useProgram(program);
        }
        checkRoot() {
            this.width = this.computedStyle[StyleKey.WIDTH] = this.style[StyleKey.WIDTH].v;
            this.height = this.computedStyle[StyleKey.HEIGHT] = this.style[StyleKey.HEIGHT].v;
        }
        setJPages(jPages) {
            jPages.forEach(item => {
                const page = new Page(item.name, item.props, []);
                page.json = item;
                this.pageContainer.appendChild(page);
            });
        }
        setPageIndex(index) {
            if (index < 0 || index >= this.pageContainer.children.length) {
                return;
            }
            if (this.lastPage) {
                if (this.lastPage === this.pageContainer.children[index]) {
                    return;
                }
                this.lastPage.updateStyle({
                    visible: false,
                });
            }
            // 延迟初始化，第一次需要显示才从json初始化Page对象
            let newPage = this.pageContainer.children[index];
            newPage.initIfNot();
            newPage.updateStyle({
                visible: true,
            });
            this.lastPage = newPage;
        }
        /**
         * 添加更新，分析repaint/reflow和上下影响，异步刷新
         * sync是动画在gotoAndStop的时候，下一帧刷新由于一帧内同步执行计算标识true
         */
        addUpdate(node, keys, focus = RefreshLevel.NONE, addDom = false, removeDom = false, sync = false, cb) {
            if (this.isDestroyed) {
                return;
            }
            let lv = focus;
            if (keys && keys.length) {
                for (let i = 0, len = keys.length; i < len; i++) {
                    const k = keys[i];
                    lv |= getLevel(k);
                }
            }
            const res = this.calUpdate(node, lv, addDom, removeDom);
            // 动画在最后一帧要finish或者cancel时，特殊调用同步计算无需刷新，不会有cb
            if (sync) {
                return;
            }
            if (res) {
                this.asyncDraw(cb);
            }
            else {
                cb && cb(true);
            }
        }
        calUpdate(node, lv, addDom, removeDom) {
            var _a;
            // 防御一下
            if (addDom || removeDom) {
                lv |= RefreshLevel.REFLOW;
            }
            if (lv === RefreshLevel.NONE || !this.computedStyle[StyleKey.VISIBLE]) {
                return false;
            }
            const isRf = isReflow(lv);
            if (isRf) {
                // 除了特殊如窗口缩放变更canvas画布会影响根节点，其它都只会是变更节点自己
                if (node === this) {
                    this.reLayout();
                }
                else {
                    checkReflow(this, node, addDom, removeDom);
                }
                if (removeDom) {
                    node.destroy();
                }
            }
            else {
                const isRp = lv >= RefreshLevel.REPAINT;
                if (isRp) {
                    (_a = node.canvasCache) === null || _a === void 0 ? void 0 : _a.release(); // 可能之前没有内容
                    node.calRepaintStyle();
                }
                else {
                    const { style, computedStyle } = node;
                    if (lv & RefreshLevel.TRANSFORM_ALL) {
                        node.calMatrix(lv);
                    }
                    if (lv & RefreshLevel.OPACITY) {
                        computedStyle[StyleKey.OPACITY] = style[StyleKey.OPACITY].v;
                    }
                    if (lv & RefreshLevel.MIX_BLEND_MODE) {
                        computedStyle[StyleKey.MIX_BLEND_MODE] = style[StyleKey.MIX_BLEND_MODE].v;
                    }
                }
            }
            // 记录节点的刷新等级，以及本帧最大刷新等级
            node.refreshLevel |= lv;
            if (addDom || removeDom) {
                this.rl |= RefreshLevel.REBUILD;
            }
            else {
                this.rl |= lv;
            }
            return true;
        }
        asyncDraw(cb) {
            if (!this.isAsyncDraw) {
                frame.onFrame(this);
                this.isAsyncDraw = true;
            }
            this.task.push(cb);
        }
        cancelAsyncDraw(cb) {
            if (!cb) {
                return;
            }
            const task = this.task;
            const i = task.indexOf(cb);
            if (i > -1) {
                task.splice(i, 1);
                if (!task.length) {
                    frame.offFrame(this);
                    this.isAsyncDraw = false;
                }
            }
        }
        draw() {
            if (this.isDestroyed) {
                return;
            }
            this.clear();
            renderWebgl(this.ctx, this, this.rl);
            this.rl = RefreshLevel.NONE;
        }
        reLayout() {
            this.checkRoot(); // 根节点必须保持和canvas同尺寸
            this.layout(this, {
                x: 0,
                y: 0,
                w: this.width,
                h: this.height,
            });
        }
        clear() {
            const gl = this.ctx;
            if (gl) {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }
        destroy() {
            super.destroy();
            frame.removeRoot(this);
        }
        /**
         * 每帧调用Root的before回调，先将存储的动画before执行，触发数据先变更完，然后若有变化或主动更新则刷新
         */
        before() {
            const ani = this.ani, task = this.taskClone = this.task.splice(0);
            ani.length; let len2 = task.length;
            // 先重置标识，动画没有触发更新，在每个before执行，如果调用了更新则更改标识
            this.aniChange = false;
            if (this.aniChange || len2) {
                this.draw();
            }
        }
        /**
         * 每帧调用的Root的after回调，将所有动画的after执行，以及主动更新的回调执行
         * 当都清空的时候，取消raf对本Root的侦听
         */
        after(diff) {
            const ani = this.ani, task = this.taskClone.splice(0);
            let len = ani.length, len2 = task.length;
            for (let i = 0; i < len2; i++) {
                let item = task[i];
                item && item();
            }
            len = ani.length; // 动画和渲染任务可能会改变自己的任务队列
            len2 = this.task.length;
            if (!len && !len2) {
                frame.offFrame(this);
                this.isAsyncDraw = false;
            }
        }
    }

    function apply(json, imgs) {
        if (!json) {
            return;
        }
        if (Array.isArray(json)) {
            return json.map(item => apply(item, imgs));
        }
        const { type, props = {}, children = [] } = json;
        if (type === 'Bitmap') {
            const src = props.src;
            if (isNumber(src)) {
                props.src = imgs[src];
            }
        }
        if (children.length) {
            json.children = apply(children, imgs);
        }
        return json;
    }
    function parse(json, canvas) {
        // json中的imgs下标替换
        json.pages = apply(json.pages, json.imgs);
        const { width, height } = canvas;
        const root = new Root(canvas, {
            style: getDefaultStyle({
                width,
                height,
            }),
        });
        root.setJPages(json.pages);
        root.setPageIndex(0);
    }

    exports.parse = parse;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
