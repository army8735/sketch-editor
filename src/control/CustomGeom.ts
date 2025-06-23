import Listener from './Listener';
import state from './state';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import { svgPolygon } from '../refresh/paint';
import { StyleUnit } from '../style/define';

class CustomGeom {
  listener: Listener;
  createHash: Record<string, () => Polyline | ShapeGroup>;
  previewHash: Record<string, (w: number, h: number) => string>;
  current?: string;
  node?: Polyline | ShapeGroup;
  cache?: number[][] | number[][][];

  constructor(listener: Listener) {
    this.listener = listener;
    this.createHash = {};
    this.previewHash = {};
  }

  register(name: string, create: () => Polyline, preview?: (w: number, h: number) => string) {
    this.createHash[name] = create;
    if (preview) {
      this.previewHash[name] = preview;
    }
  }

  unRegister(name: string) {
    delete this.createHash[name];
    delete this.previewHash[name];
  }

  hasRegister(name: string) {
    return !!this.createHash[name];
  }

  // 触发进入绘制自定义图形状态，一般是由点击绘制自定义的button开始
  trigger(name: string) {
    if (name && this.createHash[name]) {
      this.cancel();
      this.current = name;
      const listener = this.listener;
      const prev = listener.state;
      listener.state = state.ADD_CUSTOM_GEOM;
      listener.dom.classList.add('add-custom');
      listener.select.hideSelect();
      listener.emit(Listener.STATE_CHANGE, prev, listener.state);
    }
  }

  cancel() {
    this.current = undefined;
    this.node = undefined;
    this.cache = undefined;
  }

  // 最终创建，一般是绘制结束后鼠标抬起结束预览，注意鼠标没有发生移动即preview()调用则不存在创建
  create() {
    const n = this.node;
    this.cancel();
    return n;
  }

  // 预览轮廓，一般是绘制过程中拖拽鼠标更改框大小实时预览
  preview(w: number, h: number) {
    const c = this.current;
    if (c && this.createHash[c]) {
      // 第一次预览即鼠标按下后发生了移动，先创建出来要添加的节点，以便获取points数据
      this.node = this.node || this.createHash[c]();
      if (this.node instanceof Polyline) {
        if (!this.cache) {
          this.cache = Polyline.buildPoints(this.node.points, true, 100, 100);
        }
        const list = this.cache.map((item) => {
          return (item as number[]).map((n, i) => {
            if (i % 2 === 0) {
              return n * w / 100;
            }
            else {
              return n * h / 100;
            }
          });
        });
        return svgPolygon(list);
      }
      else {
        if (!this.cache) {
          const clone = this.node.clone();
          clone.style.width = { v: 100, u: StyleUnit.PX };
          clone.style.height = { v: 100, u: StyleUnit.PX };
          clone.willMount();
          clone.layout({
            w: 100,
            h: 100,
          });
          clone.didMount();
          clone.buildPoints();
          this.cache = clone.coords!;
        }
        const list = this.cache.map((item) => {
          return (item as number[][]).map((item2) => {
            return (item2 as number[]).map((n, i) => {
              if (i % 2 === 0) {
                return n * w / 100;
              }
              else {
                return n * h / 100;
              }
            });
          });
        });
        return list.map(item => svgPolygon(item)).join(' ');
      }
    }
  }
}

export default CustomGeom;
