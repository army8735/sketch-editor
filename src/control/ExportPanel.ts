import JSZip from 'jszip';
import Node from '../node/Node';
import Root from '../node/Root';
import { ExportFormats } from '../format';
import ExportCommand from '../history/ExportCommand';
import Panel from './Panel';
import Listener from './Listener';
import state from './state';
import { toBitmap } from '../tools/node';
import { clone } from '../util/type';

const html = `
  <h4 class="panel-title">导出<b class="btn add"></b></h4>
  <div class="exp"></div>
  <div class="preview"></div>
  <div class="bar">
    <div class="export-btn">导出<span></span></div>
  </div>
`;

function renderItem(fileFormat: 'png' | 'jpg' | 'webp', scale: number, idx: number) {
  const div = document.createElement('div');
  div.className = 'item';
  div.title = idx.toString();
  div.innerHTML = `<div class="size">
    <div class="input-unit">
      <input type="number" step="1" min="0" max="1000" value="${scale}"/>
      <span class="unit">x</span>
    </div>
    <span class="intro">尺寸</span>
  </div>
  <div class="format">
    <select>
      <option ${fileFormat === 'png' ? 'selected="selected"' : ''}>png</option>
      <option ${fileFormat === 'jpg' ? 'selected="selected"' : ''}>jpg</option>
      <option ${fileFormat === 'webp' ? 'selected="selected"' : ''}>webp</option>
    </select>
    <span class="intro">格式</span>
  </div>
  <b class="btn del"></b>`;
  return div;
}

class ExportPanel extends Panel {
  panel: HTMLElement;
  exportFormats: ExportFormats[];
  previewRoot?: Root;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.exportFormats = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'export-panel';
    panel.innerHTML = html;
    dom.appendChild(panel);

    const callback = (prev?: ExportFormats[][]) => {
      this.silence = true;
      prev = prev ||  this.nodes.map(item => {
        return clone(item.exportOptions.exportFormats);
      });
      const c = new ExportCommand(this.nodes.slice(0), prev.map((item) => {
        return {
          prev: item,
          next: clone(this.exportFormats),
        };
      }));
      c.execute();
      listener.history.addCommand(c);
      listener.emit(Listener.EXPORT_NODE, this.nodes.slice(0));
      this.silence = false;
    };

    const add = panel.querySelector('.btn.add') as HTMLElement;
    const bar = panel.querySelector('.bar') as HTMLElement;
    const exportBtn = bar.querySelector('.export-btn') as HTMLElement;

    add.addEventListener('click', (e) => {
      const div = renderItem('png', 1, this.exportFormats.length);
      const exp = panel.querySelector('.exp') as HTMLElement;
      exp.appendChild(div);
      bar.style.display = 'block';
      this.exportFormats.push({
        fileFormat: 'png',
        scale: 1,
      });
      callback();
      this.preview();
    });

    const download = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      if (typeof link.download === 'string') {
        document.body.appendChild(link);
        link.download = name;
        link.href = url;
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      else {
        location.replace(url);
      }
    };

    exportBtn.addEventListener('click', async (e) => {
      const { nodes, exportFormats } = this;
      if (!nodes.length || !exportFormats.length) {
        return;
      }
      if (nodes.length === 1) {
        exportFormats.forEach((item, i) => {
          toBitmap(nodes[0], {
            type: item.fileFormat,
            scale: item.scale,
            blob: true,
          }).then(res => {
            download(res as Blob, i + '-' + nodes[0].name + '.' + item.fileFormat);
          });
        });
      }
      else {
        const zip = new JSZip();
        for (let i = 0, len = nodes.length; i < len; i++) {
          const node = nodes[i];
          for (let j = 0, len2 = exportFormats.length; j < len2; j++) {
            const item = exportFormats[j];
            const res = await toBitmap(node, {
              type: item.fileFormat,
              scale: item.scale,
              blob: true,
            });
            zip.file(i + '-' + j + '-' + node.name + '.' + item.fileFormat, res as Blob);
          }
        }
        const res = await zip.generateAsync({ type: 'blob' });
        download(res, nodes.length + '个图层.zip');
      }
    });

    panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      if (classList.contains('del')) {
        const div = target.parentElement as HTMLElement;
        const idx = +div.title;
        div.remove();
        this.exportFormats.splice(idx, 1);
        if (!this.exportFormats.length) {
          bar.style.display = 'none';
        }
        callback();
        this.preview();
      }
    });

    panel.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      let idx = -1;
      if (tagName === 'INPUT') {
        idx = +target.parentElement!.parentElement!.parentElement!.title;
        this.exportFormats[idx].scale = +(target as HTMLInputElement).value;
        this.preview();
      }
      else if (tagName === 'SELECT') {
        idx = +target.parentElement!.parentElement!.title;
        this.exportFormats[idx].fileFormat = (target as HTMLSelectElement).value as ExportFormats['fileFormat'];
      }
      if (idx > -1) {
        callback();
      }
    });

    listener.on([Listener.EXPORT_NODE, Listener.STATE_CHANGE], (nodes) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  preview() {
    const { panel, nodes } = this;
    if (this.previewRoot) {
      this.previewRoot.destroy();
      this.previewRoot = undefined;
    }
    const preview = panel.querySelector('.preview') as HTMLElement;
    preview.querySelector('canvas')?.remove();
    if (nodes.length === 1 && this.exportFormats.length) {
      preview.style.display = 'block';
      // 导出有高清的才预览高清dpi
      let dpi = 1;
      for (let i = 0, len = this.exportFormats.length; i < len; i++) {
        if (this.exportFormats[i].scale >= 2) {
          dpi = 2;
          break;
        }
      }
      // 简单渲染
      const clientWidth = preview.clientWidth;
      const { filterBbox2 } = nodes[0];
      const width = filterBbox2[2] - filterBbox2[0];
      const height = filterBbox2[3] - filterBbox2[1];
      preview.style.height = clientWidth * Math.min(1, height / width) + 'px';
      const scale = clientWidth / Math.max(width, height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale * dpi);
      canvas.height = Math.ceil(height * scale * dpi);
      canvas.style.width = Math.ceil(width * scale) + 'px';
      canvas.style.height = Math.ceil(height * scale) + 'px';
      preview.appendChild(canvas);
      const root = this.previewRoot = new Root({
        dpi: dpi,
        uuid: '',
        index: 0,
        style: {
          width: Math.ceil(width * scale * dpi),
          height: Math.ceil(height * scale * dpi),
        },
      });
      root.appendTo(canvas);
      const clone = nodes[0].clone();
      clone.updateStyle({
        left: -filterBbox2[0],
        top: -filterBbox2[1],
        right: 'auto',
        bottom: 'auto',
        width: nodes[0].width,
        height: nodes[0].height,
        translateX: 0,
        translateY: 0,
      });
      root.getCurPageWithCreate().appendChild(clone);
      if (scale !== 1) {
        const p = root.getCurPage();
        p!.updateStyle({
          scaleX: scale,
          scaleY: scale,
        });
      }
    }
    else {
      preview.style.display = 'none';
    }
  }

  override show(nodes: Node[]) {
    super.show(nodes);
    const panel = this.panel;
    if (!nodes.length || this.listener.state !== state.NORMAL) {
      panel.style.display = 'none';
      if (this.previewRoot) {
        this.previewRoot.destroy();
        this.previewRoot = undefined;
      }
      return;
    }
    panel.style.display = 'block';

    const maxHash: Record<string, number> = {};
    nodes.forEach(node => {
      // 统计下当前节点导出配置项有几个，每个出现几次
      const hash: Record<string, number> = {};
      node.exportOptions.exportFormats?.forEach(item => {
        const { fileFormat, scale } = item;
        // 格式化+缩放作为key统计配置项
        const key = fileFormat + '.' + scale;
        if (!hash[key]) {
          hash[key] = 0;
        }
        hash[key]++;
        // 和max做对比，每个配置项取最大值
        if (!maxHash[key]) {
          maxHash[key] = 0;
        }
        maxHash[key] = Math.max(maxHash[key], hash[key]);
      });
    });
    const fragment = document.createDocumentFragment();
    let count = 0;
    this.exportFormats.splice(0);
    Object.keys(maxHash).forEach(k => {
      const arr = k.split('.');
      const fileFormat = arr[0] as ExportFormats['fileFormat'];
      const scale = +arr[1];
      let i = maxHash[k];
      while (i--) {
        this.exportFormats.push({ fileFormat, scale });
        const div = renderItem(fileFormat, scale, count++);
        fragment.appendChild(div);
      }
    });
    const exp = panel.querySelector('.exp') as HTMLElement;
    exp.innerHTML = '';
    exp.appendChild(fragment);

    this.preview();

    const span = panel.querySelector('.export-btn span') as HTMLElement;
    if (nodes.length > 1) {
      span.innerHTML = nodes.length + '个图层';
    }
    else {
      span.innerHTML = nodes[0].name;
    }
    const bar = panel.querySelector('.bar') as HTMLElement;
    if (this.exportFormats.length) {
      bar.style.display = 'block';
    }
    else {
      bar.style.display = 'none';
    }
  }
}

export default ExportPanel;
