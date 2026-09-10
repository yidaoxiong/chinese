/** iPad-friendly handwriting canvas. It records strokes for the child’s own
 * self-check; it deliberately does not claim to recognise handwriting. */
export class HandwritingController {
  constructor(root, { onDone, onChange } = {}) {
    this.root = root;
    this.canvas = root?.querySelector('canvas') || null;
    this.ctx = this.canvas?.getContext('2d') || null;
    this.onDone = onDone;
    this.onChange = onChange;
    this.strokes = [];
    this.currentStroke = null;
    this.eraser = false;
    this.cssSize = null;
    this.bound = false;
    if (this.canvas) this.bind();
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', (event) => this.start(event));
    this.canvas.addEventListener('pointermove', (event) => this.move(event));
    this.canvas.addEventListener('pointerup', (event) => this.end(event));
    this.canvas.addEventListener('pointercancel', (event) => this.end(event));
    this.canvas.addEventListener('pointerleave', (event) => { if (this.currentStroke) this.end(event); });
    this.root.querySelector('[data-handwriting-undo]')?.addEventListener('click', () => this.undo());
    this.root.querySelector('[data-handwriting-clear]')?.addEventListener('click', () => this.clear());
    this.root.querySelector('[data-handwriting-eraser]')?.addEventListener('click', (event) => {
      this.eraser = !this.eraser;
      event.currentTarget.classList.toggle('active', this.eraser);
    });
    this.root.querySelector('[data-handwriting-done]')?.addEventListener('click', () => this.done());
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    }
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const oldSize = this.cssSize;
    if (oldSize && (oldSize.width !== rect.width || oldSize.height !== rect.height)) {
      const scaleX = rect.width / oldSize.width;
      const scaleY = rect.height / oldSize.height;
      this.strokes = this.strokes.map((stroke) => stroke.map((point) => ({ ...point, x: point.x * scaleX, y: point.y * scaleY })));
    }
    this.cssSize = { width: rect.width, height: rect.height };
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.redraw();
  }

  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, pressure: event.pressure || .5 };
  }

  start(event) {
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    this.currentStroke = [this.point(event)];
    this.drawSegment(this.currentStroke[0], this.currentStroke[0]);
    this.onChange?.({ strokes: true, controller: this });
  }

  move(event) {
    if (!this.currentStroke) return;
    event.preventDefault();
    const next = this.point(event);
    const previous = this.currentStroke[this.currentStroke.length - 1];
    this.currentStroke.push(next);
    this.drawSegment(previous, next);
  }

  end(event) {
    if (!this.currentStroke) return;
    event.preventDefault();
    if (this.eraser) {
      const points = this.currentStroke;
      const radius = 24;
      this.strokes = this.strokes.filter((stroke) => !stroke.some((point) => points.some((eraserPoint) => {
        const dx = point.x - eraserPoint.x;
        const dy = point.y - eraserPoint.y;
        return dx * dx + dy * dy <= radius * radius;
      })));
    } else if (this.currentStroke.length) this.strokes.push(this.currentStroke);
    this.currentStroke = null;
    this.redraw();
    this.onChange?.({ strokes: this.hasStroke(), controller: this });
  }

  drawSegment(from, to) {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.globalCompositeOperation = this.eraser ? 'destination-out' : 'source-over';
    this.ctx.strokeStyle = this.eraser ? 'rgba(0,0,0,1)' : '#29252b';
    this.ctx.lineWidth = this.eraser ? 24 : 2.4 + Math.min(.9, (to.pressure || .5) * 1.4);
    this.ctx.beginPath(); this.ctx.moveTo(from.x, from.y); this.ctx.lineTo(to.x, to.y); this.ctx.stroke(); this.ctx.restore();
  }

  redraw() {
    if (!this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    const mode = this.eraser; this.eraser = false;
    for (const stroke of this.strokes) for (let index = 1; index < stroke.length; index += 1) this.drawSegment(stroke[index - 1], stroke[index]);
    this.eraser = mode;
  }

  undo() { this.strokes.pop(); this.redraw(); this.onChange?.({ strokes: this.hasStroke(), controller: this }); }
  clear() { this.strokes = []; this.currentStroke = null; this.redraw(); this.onChange?.({ strokes: false, controller: this }); }
  hasStroke() { return this.strokes.length > 0 || Boolean(this.currentStroke?.length); }

  done() {
    const strokes = this.hasStroke();
    this.onDone?.({ strokes, controller: this });
  }
}

export function createHandwritingController(root, options) { return new HandwritingController(root, options); }
