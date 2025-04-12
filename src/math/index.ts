import geom from './geom';
import matrix from './matrix';
import vector from './vector';
import isec from './isec';
import bezier from './bezier';
import blur from './blur';

export function toPrecision(num: number, p: number = 2) {
  const t = Math.pow(10, p);
  return Math.round(num * t) / t;
}

export default {
  geom,
  matrix,
  vector,
  isec,
  bezier,
  toPrecision,
  blur,
};
