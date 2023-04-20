import { isFunction } from './type';

class Event {
  __eHash: any;

  constructor() {
    this.__eHash = {};
  }

  on(id: string, handle: (...p: any[]) => void) {
    if (!isFunction(handle)) {
      return;
    }
    if (Array.isArray(id)) {
      for (let i = 0, len = id.length; i < len; i++) {
        this.on(id[i], handle);
      }
    }
    else {
      if (!this.__eHash.hasOwnProperty(id)) {
        this.__eHash[id] = [];
      }
      // 遍历防止此handle被侦听过了
      for (let i = 0, item = this.__eHash[id], len = item.length; i < len; i++) {
        if (item[i] === handle) {
          return this;
        }
      }
      this.__eHash[id].push(handle);
    }
    return this;
  }

  once(id: string, handle: (...p: any[]) => void) {
    if (!isFunction(handle)) {
      return;
    }

    // 包裹一层会导致添加后删除对比引用删不掉，需保存原有引用进行对比
    const cb = () => {
      handle.apply(this, Array.prototype.slice.call(arguments));
      this.off(id, cb);
    }

    cb.__eventCb = handle;
    if (Array.isArray(id)) {
      for (let i = 0, len = id.length; i < len; i++) {
        this.once(id[i], handle);
      }
    }
    else {
      this.on(id, cb);
    }
    return this;
  }

  off(id: string, handle: (...p: any[]) => void) {
    if (Array.isArray(id)) {
      for (let i = 0, len = id.length; i < len; i++) {
        this.off(id[i], handle);
      }
    }
    else if (this.__eHash.hasOwnProperty(id)) {
      if (handle) {
        for (let i = 0, item = this.__eHash[id], len = item.length; i < len; i++) {
          // 需考虑once包裹的引用对比
          if (item[i] === handle || item[i].__eventCb === handle) {
            item.splice(i, 1);
            break;
          }
        }
      }
      // 未定义为全部清除
      else {
        delete this.__eHash[id];
      }
    }
    return this;
  }

  emit(id: string, ...data: any) {
    if (Array.isArray(id)) {
      for (let i = 0, len = id.length; i < len; i++) {
        this.emit(id[i], data);
      }
    }
    else {
      if (this.__eHash.hasOwnProperty(id)) {
        let list = this.__eHash[id];
        if (list.length) {
          list = list.slice();
          for (let i = 0, len = list.length; i < len; i++) {
            const cb = list[i];
            if (isFunction(cb)) {
              cb.apply(this, data);
            }
          }
        }
      }
    }
    return this;
  }

  static REFRESH = 'refresh';
  static DID_ADD_DOM = 'didAddDom';
  static WILL_REMOVE_DOM = 'willRemoveDom';
  static PAGE_CHANGED = 'pageChanged';
  static VISIBLE_CHANGED = 'visibleChanged';

}

export default Event;
