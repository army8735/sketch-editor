export type LayoutData = {
  x: number,
  y: number,
  w: number,
  h: number,
};

export function mergeBbox(res: Float64Array, target: Float64Array) {
  res[0] = Math.min(res[0], target[0]);
  res[1] = Math.min(res[1], target[1]);
  res[2] = Math.max(res[2], target[2]);
  res[3] = Math.max(res[3], target[3]);
}

export function resetBbox(res: Float64Array) {
  res[0] = res[1] = res[2] = res[3] = 0;
}

export function assignBbox(res: Float64Array, from: Float64Array) {
  res[0] = from[0];
  res[1] = from[1];
  res[2] = from[2];
  res[3] = from[3];
}
