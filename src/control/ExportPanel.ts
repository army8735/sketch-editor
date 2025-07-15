import JSZip from 'jszip';
import Node from '../node/Node';
import Root from '../node/Root';
import { ExportFormats } from '../format';
import ExportCommand from '../history/ExportCommand';
import Panel from './Panel';
import Listener from './Listener';
import state from './state';
import { toBitmap } from '../tools/node';

const html = `
  <h4 class="panel-title">导出<b class="btn add"></b></h4>
  <div class="exp"></div>
  <div class="bar">
    <div class="export-btn">导出<span></span></div>
  </div>
`;

function renderItem(fileFormat: 'png' | 'jpg' | 'webp', scale: number, idx: number) {
  return `<div class="item" title="${idx}">
    <div class="size">
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
    <b class="btn del"></b>
  </div>`;
}

class ExportPanel extends Panel {
  panel: HTMLElement;
  exportFormats: ExportFormats[];

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
        return item.exportOptions.exportFormats;
      });
      const c = new ExportCommand(this.nodes.slice(0), prev.map((item) => {
        return {
          prev: item,
          next: this.exportFormats.slice(0),
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
      const s = renderItem('png', 1, this.exportFormats.length);
      const exp = panel.querySelector('.exp') as HTMLElement;
      exp.innerHTML += s;
      bar.style.display = 'block';
      this.exportFormats.push({
        fileFormat: 'png',
        scale: 1,
      });
      callback();
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
        exportFormats.forEach(item => {
          toBitmap(nodes[0], {
            type: item.fileFormat,
            scale: item.scale,
            blob: true,
          }).then(res => {
            download(res as Blob, nodes[0].name + '.' + item.fileFormat);
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
            zip.file(node.name + '.' + item.fileFormat, res as Blob);
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
      }
    });

    panel.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      let idx = -1;
      if (tagName === 'INPUT') {
        idx = +target.parentElement!.parentElement!.parentElement!.title;
        this.exportFormats[idx].scale = +(target as HTMLInputElement).value;
      }
      else if (tagName === 'SELECT') {
        idx = +target.parentElement!.parentElement!.title;
        this.exportFormats[idx].fileFormat = (target as HTMLSelectElement).value as ExportFormats['fileFormat'];
      }
      if (idx > -1) {
        callback();
      }
    });

    listener.on(Listener.EXPORT_NODE, (nodes) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  override show(nodes: Node[]) {
    super.show(nodes);
    const panel = this.panel;
    if (!nodes.length || this.listener.state !== state.NORMAL) {
      panel.style.display = 'none';
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
    let s = '';
    let count = 0;
    this.exportFormats.splice(0);
    Object.keys(maxHash).forEach(k => {
      const arr = k.split('.');
      const fileFormat = arr[0] as ExportFormats['fileFormat'];
      const scale = +arr[1];
      let i = maxHash[k];
      while (i--) {
        this.exportFormats.push({ fileFormat, scale });
        s += renderItem(fileFormat, scale, count++);
      }
    });
    const exp = panel.querySelector('.exp') as HTMLElement;
    exp.innerHTML = s;

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
