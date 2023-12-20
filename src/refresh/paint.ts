export function canvasPolygon(ctx: CanvasRenderingContext2D, list: number[][],
                              scale: number, dx = 0, dy = 0) {
  if (!list || !list.length) {
    return;
  }
  // 防止空值开始
  let start = -1;
  for (let i = 0, len = list.length; i < len; i++) {
    let item = list[i];
    if (Array.isArray(item) && item.length) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return;
  }
  let first = list[start];
  // 特殊的情况，布尔运算数学库会打乱原有顺序，致使第一个点可能有冗余的贝塞尔值，move到正确的索引坐标
  if (first.length === 4) {
    ctx.moveTo(first[2] * scale + dx, first[3] * scale + dy);
  }
  else if (first.length === 6) {
    ctx.moveTo(first[4] * scale + dx, first[5] * scale + dy);
  }
  else {
    ctx.moveTo(first[0] * scale + dx, first[1] * scale + dy);
  }
  for (let i = start + 1, len = list.length; i < len; i++) {
    let item = list[i];
    if (!Array.isArray(item)) {
      continue;
    }
    if (item.length === 2) {
      ctx.lineTo(item[0] * scale + dx, item[1] * scale + dy);
    }
    else if (item.length === 4) {
      ctx.quadraticCurveTo(item[0] * scale + dx, item[1] * scale + dy, item[2] * scale + dx, item[3] * scale + dy);
    }
    else if (item.length === 6) {
      ctx.bezierCurveTo(item[0] * scale + dx, item[1] * scale + dy, item[2] * scale + dx, item[3] * scale + dy, item[4] * scale + dx, item[5] * scale + dy);
    }
  }
}

export function svgPolygon(list: number[][], dx = 0, dy = 0) {
  if (!list || !list.length) {
    return '';
  }
  let start = -1;
  for (let i = 0, len = list.length; i < len; i++) {
    let item = list[i];
    if (Array.isArray(item) && item.length) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return '';
  }
  let s: string;
  let first = list[start];
  // 特殊的情况，布尔运算数学库会打乱原有顺序，致使第一个点可能有冗余的贝塞尔值，move到正确的索引坐标
  if (first.length === 4) {
    s = 'M' + (first[2] + dx) + ',' + (first[3] + dy);
  }
  else if (first.length === 6) {
    s = 'M' + (first[4] + dx) + ',' + (first[5] + dy);
  }
  else {
    s = 'M' + (first[0] + dx) + ',' + (first[1] + dy);
  }
  for (let i = start + 1, len = list.length; i < len; i++) {
    let item = list[i];
    if (!Array.isArray(item)) {
      continue;
    }
    if (item.length === 2) {
      s += 'L' + (item[0] + dx) + ',' + (item[1] + dy);
    }
    else if (item.length === 4) {
      s += 'Q' + (item[0] + dx) + ',' + (item[1] + dy) + ' ' + (item[2] + dx) + ',' + (item[3] + dy);
    }
    else if (item.length === 6) {
      s += 'C' + (item[0] + dx) + ',' + (item[1] + dy) + ' ' + (item[2] + dx) + ',' + (item[3] + dy) + ' ' + (item[4] + dx) + ',' + (item[5] + dy);
    }
  }
  return s;
}

export default {
  canvasPolygon,
  svgPolygon,
};
