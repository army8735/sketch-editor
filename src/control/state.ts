export enum state {
  NORMAL = 0,
  HAND = 1,
  RESIZE = 2,
  EDIT_TEXT = 3, // 编辑文字进入特殊状态
  EDIT_GRADIENT = 4, // 编辑渐变
  EDIT_GEOM = 5, // 编辑矢量
  ADD_TEXT = 6, // 添加文字状态，按下会变成编辑
  ADD_RECT = 7, // 添加矢量
  ADD_OVAL = 8,
  ADD_ROUND = 9,
  ADD_TRIANGLE = 10,
  ADD_LINE = 11,
  ADD_STAR = 12,
  ADD_IMG = 13,
}

export default state;
