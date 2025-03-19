export enum state {
  NORMAL = 0,
  HAND = 1,
  RESIZE = 2,
  EDIT_TEXT = 3, // 编辑文字进入特殊状态
  EDIT_GRADIENT = 4, // 编辑渐变
  EDIT_GEOM = 5, // 编辑矢量
  ADD_TEXT = 6, // 添加状态很快会变成编辑
}

export default state;
