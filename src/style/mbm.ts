import { MIX_BLEND_MODE } from './define';

export function getCanvasGCO (blend: MIX_BLEND_MODE) {
  switch (blend) {
    case MIX_BLEND_MODE.MULTIPLY:
      return 'multiply';
    case MIX_BLEND_MODE.SCREEN:
      return 'screen';
    case MIX_BLEND_MODE.OVERLAY:
      return 'overlay';
    case MIX_BLEND_MODE.DARKEN:
      return 'darken';
    case MIX_BLEND_MODE.LIGHTEN:
      return 'lighten';
    case MIX_BLEND_MODE.COLOR_DODGE:
      return 'color-dodge';
    case MIX_BLEND_MODE.COLOR_BURN:
      return 'color-burn';
    case MIX_BLEND_MODE.HARD_LIGHT:
      return 'hard-light';
    case MIX_BLEND_MODE.SOFT_LIGHT:
      return 'soft-light';
    case MIX_BLEND_MODE.DIFFERENCE:
      return 'difference';
    case MIX_BLEND_MODE.EXCLUSION:
      return 'exclusion';
    case MIX_BLEND_MODE.HUE:
      return 'hue';
    case MIX_BLEND_MODE.SATURATION:
      return 'saturation';
    case MIX_BLEND_MODE.COLOR:
      return 'color';
    case MIX_BLEND_MODE.LUMINOSITY:
      return 'luminosity';
    default:
      return 'source-over';
  }
}
