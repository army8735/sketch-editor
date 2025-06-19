import Listener from './Listener';
import state from './state';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';

class CustomGeom {
  listener: Listener;
  createHash: Record<string, () => Polyline | ShapeGroup>;
  previewHash: Record<string, (w: number, h: number) => string>;
  current?: string;

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

  trigger(name: string) {
    if (name && this.createHash[name]) {
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
    if (this.current) {
      this.current = undefined;
    }
  }

  create() {
    const c = this.current;
    this.cancel();
    if (c && this.createHash[c]) {
      return this.createHash[c]();
    }
  }

  preview(w: number, h: number) {
    if (this.current && this.previewHash[this.current]) {
      return this.previewHash[this.current](w, h);
    }
  }
}

export default CustomGeom;
