export function canvasPolygon(ctx: CanvasRenderingContext2D, list: Array<Array<number>>, dx = 0, dy = 0) {
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
    ctx.moveTo(first[2] + dx, first[3] + dy);
  }
  else if (first.length === 6) {
    ctx.moveTo(first[4] + dx, first[5] + dy);
  }
  else {
    ctx.moveTo(first[0] + dx, first[1] + dy);
  }
  for (let i = start + 1, len = list.length; i < len; i++) {
    let item = list[i];
    if (!Array.isArray(item)) {
      continue;
    }
    if (item.length === 2) {
      ctx.lineTo(item[0] + dx, item[1] + dy);
    }
    else if (item.length === 4) {
      ctx.quadraticCurveTo(item[0] + dx, item[1] + dy, item[2] + dx, item[3] + dy);
    }
    else if (item.length === 6) {
      ctx.bezierCurveTo(item[0] + dx, item[1] + dy, item[2] + dx, item[3] + dy, item[4] + dx, item[5] + dy);
    }
  }
}

export function svgPolygon(list: Array<Array<number>>, dx = 0, dy = 0) {
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
    s = 'M' + first[2] + ',' + first[3];
  }
  else if (first.length === 6) {
    s = 'M' + first[4] + ',' + first[5];
  }
  else {
    s = 'M' + first[0] + ',' + first[1];
  }
  for (let i = start + 1, len = list.length; i < len; i++) {
    let item = list[i];
    if (!Array.isArray(item)) {
      continue;
    }
    if (item.length === 2) {
      s += 'L' + item[0] + ',' + item[1];
    }
    else if (item.length === 4) {
      s += 'Q' + item[0] + ',' + item[1] + ' ' + item[2] + ',' + item[3];
    }
    else if (item.length === 6) {
      s += 'C' + item[0] + ',' + item[1] + ' ' + item[2] + ',' + item[3] + ' ' + item[4] + ',' + item[5];
    }
  }
  return s;
}

export default {
  canvasPolygon,
  svgPolygon,
};
