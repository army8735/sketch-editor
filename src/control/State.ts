enum State {
  NORMAL = 0,
  EDIT_TEXT = 1, // 编辑文字进入特殊状态
  EDIT_GRADIENT = 2, // 编辑渐变
  EDIT_GEOM = 3, // 编辑矢量
}

export default State;
