export interface Listener {
  onMouseDown: (e: MouseEvent) => boolean;
  onMouseMove: (e: MouseEvent) => boolean;
  onMouseUp: () => boolean;
  onClick: (e: MouseEvent) => boolean;
}
