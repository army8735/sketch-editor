import Root from '../node/Root';
import inject from '../util/inject';
import { isFunction } from '../util/type';

let isPause: boolean;

export interface FrameCallback {
  before?: Function;
  after: Function;
  ref?: any;
}

function traversalBefore(list: Array<FrameCallback>, length: number, diff: number) {
  for (let i = 0; i < length; i++) {
    let item = list[i];
    item.before && item.before(diff);
  }
}

function traversalAfter(list: Array<FrameCallback>, length: number, diff: number) {
  for (let i = 0; i < length; i++) {
    let item = list[i];
    item.after(diff);
  }
}

export class Frame {
  rootTask: Array<FrameCallback>;
  roots: Array<Root>;
  task: Array<FrameCallback>;
  now: number;
  id: number;

  constructor() {
    this.rootTask = [];
    this.roots = [];
    this.task = [];
    this.now = inject.now();
    this.id = 0;
  }

  private init() {
    let self = this;
    let { task } = self;
    inject.cancelAnimationFrame(self.id);
    let last = self.now = inject.now();

    function cb() {
      // 必须清除，可能会发生重复，当动画finish回调中gotoAndPlay(0)，下方结束判断发现aTask还有值会继续，新的init也会进入再次执行
      inject.cancelAnimationFrame(self.id);
      self.id = inject.requestAnimationFrame(function () {
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

  onFrame(handle: FrameCallback | Function) {
    if (!handle) {
      return;
    }
    let { task } = this;
    if (!task.length) {
      this.init();
    }
    if (isFunction(handle)) {
      handle = {
        after: handle as Function,
        ref: handle,
      };
    }
    task.push(handle as FrameCallback);
  }

  offFrame(handle: FrameCallback | Function) {
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

  nextFrame(handle: FrameCallback | Function) {
    if (!handle) {
      return;
    }
    // 包裹一层会导致添加后删除对比引用删不掉，需保存原有引用进行对比
    let cb = isFunction(handle) ? {
      after: (diff: number) => {
        (handle as Function)(diff);
        this.offFrame(cb);
      },
    } : {
      before: (handle as FrameCallback).before,
      after: (diff: number) => {
        (handle as FrameCallback).after && (handle as FrameCallback).after!(diff);
        this.offFrame(cb);
      },
    };
    (cb as FrameCallback).ref = handle;
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

  addRoot(root: Root) {
    this.roots.push(root);
  }

  removeRoot(root: Root) {
    let i = this.roots.indexOf(root);
    if (i > -1) {
      this.roots.splice(i, 1);
    }
  }
}

export const frame = new Frame();
