/** iPad-friendly handwriting canvas. It records strokes for the child’s own
 * self-check; it deliberately does not claim to recognise handwriting. */
export class HandwritingController {
  constructor(root, { onDone } = {}) {
    this.root = root;
    this.canvas = root?.querySelector('canvas') || null;
    this.ctx = this.canvas?.getContext('2d') || null;
    this.onDone = onDone;
    this.strokes = [];
    this.currentStroke = null;
    this.eraser = false;
    this.previousOverflow = '';
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
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const old = this.strokes;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.strokes = old;
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

  undo() { this.strokes.pop(); this.redraw(); }
  clear() { this.strokes = []; this.currentStroke = null; this.redraw(); }
  hasStroke() { return this.strokes.length > 0 || Boolean(this.currentStroke?.length); }

  async open() {
    this.root.classList.remove('hidden');
    this.resize();
    document.body.classList.add('handwriting-open');
    this.previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    try { await this.root.requestFullscreen?.({ navigationUI: 'hide' }); } catch { /* fixed overlay remains usable */ }
    this.resize();
  }

  async close() {
    if (document.fullscreenElement === this.root) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
    document.documentElement.style.overflow = this.previousOverflow;
    document.body.classList.remove('handwriting-open');
    this.root.classList.add('hidden');
  }

  done() {
    const strokes = this.hasStroke();
    this.onDone?.({ strokes, controller: this });
    void this.close();
  }
}

export function createHandwritingController(root, options) { return new HandwritingController(root, options); }
