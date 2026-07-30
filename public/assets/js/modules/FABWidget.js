export class FABWidget {
  constructor() {
    this.widget = null;
    this.fabBtn = null;
    this.fabIcon = null;
    this.panel = null;

    this._isOpen = false;
    this._dragging = false;
    this._moved = false;
    this._startX = 0;
    this._startY = 0;
    this._originX = 0;
    this._originY = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  init() {
    this.widget = document.getElementById('fabWidget');
    this.fabBtn = document.getElementById('fabBtn');
    this.fabIcon = document.getElementById('fabIcon');
    this.panel = document.getElementById('sidebar');

    if (!this.widget || !this.fabBtn || !this.panel) {
      console.warn('[FABWidget] Required DOM elements not found');
      return;
    }

    this._initPosition();
    this.fabBtn.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('resize', this._onResize);
  }

  destroy() {
    if (this.fabBtn) {
      this.fabBtn.removeEventListener('pointerdown', this._onPointerDown);
    }
    window.removeEventListener('resize', this._onResize);
  }

  isOpen() {
    return this._isOpen;
  }

  open() {
    if (this._isOpen) return;
    this._updatePanelPosition();
    void this.panel.offsetWidth;
    this.panel.classList.add('open');
    this.widget.classList.add('open');
    this.fabIcon.className = 'fas fa-times';
    this._isOpen = true;
  }

  close() {
    if (!this._isOpen) return;
    this.panel.classList.remove('open');
    this.widget.classList.remove('open');
    this.fabIcon.className = 'fas fa-sliders-h';
    this._isOpen = false;
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  _updatePanelPosition() {
    const GAP = 16;
    const MARGIN = 12;
    const wr = this.widget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = this.panel.offsetWidth;
    const ph = this.panel.offsetHeight;
    const edge = this.widget.dataset.edge || 'right';

    let vLeft, vTop, origin;

    if (edge === 'left') {
      vLeft = wr.right + GAP;
      vTop = this._clamp(wr.top + wr.height / 2 - ph / 2, MARGIN, vh - ph - MARGIN);
      origin = 'left center';
    } else if (edge === 'right') {
      vLeft = wr.left - GAP - pw;
      vTop = this._clamp(wr.top + wr.height / 2 - ph / 2, MARGIN, vh - ph - MARGIN);
      origin = 'right center';
    } else if (edge === 'top') {
      vTop = wr.bottom + GAP;
      vLeft = this._clamp(wr.left + wr.width / 2 - pw / 2, MARGIN, vw - pw - MARGIN);
      origin = 'top center';
    } else {
      vTop = wr.top - GAP - ph;
      vLeft = this._clamp(wr.left + wr.width / 2 - pw / 2, MARGIN, vw - pw - MARGIN);
      origin = 'bottom center';
    }

    this.panel.style.left = (vLeft - wr.left) + 'px';
    this.panel.style.top = (vTop - wr.top) + 'px';
    this.panel.style.transformOrigin = origin;
  }

  _initPosition() {
    const MARGIN = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.widget.style.left = (vw - this.widget.offsetWidth - MARGIN) + 'px';
    this.widget.style.top = (vh - this.widget.offsetHeight - MARGIN - 90) + 'px';
    this.widget.dataset.edge = 'right';
  }

  _snapToEdge(animate) {
    const MARGIN = 12;
    const rect = this.widget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const distLeft = cx;
    const distRight = vw - cx;
    const distTop = cy;
    const distBottom = vh - cy;
    const min = Math.min(distLeft, distRight, distTop, distBottom);

    let left = rect.left;
    let top = rect.top;
    let edge = 'right';

    if (min === distLeft) {
      edge = 'left';
      left = MARGIN;
      top = this._clamp(rect.top, MARGIN, vh - rect.height - MARGIN);
    } else if (min === distRight) {
      edge = 'right';
      left = vw - rect.width - MARGIN;
      top = this._clamp(rect.top, MARGIN, vh - rect.height - MARGIN);
    } else if (min === distTop) {
      edge = 'top';
      top = MARGIN;
      left = this._clamp(rect.left, MARGIN, vw - rect.width - MARGIN);
    } else {
      edge = 'bottom';
      top = vh - rect.height - MARGIN;
      left = this._clamp(rect.left, MARGIN, vw - rect.width - MARGIN);
    }

    this.widget.dataset.edge = edge;

    if (animate) {
      this.widget.style.transition = 'left .35s cubic-bezier(0.05, 0.7, 0.1, 1.0), top .35s cubic-bezier(0.05, 0.7, 0.1, 1.0)';
      const clear = () => {
        this.widget.style.transition = '';
        this.widget.removeEventListener('transitionend', clear);
      };
      this.widget.addEventListener('transitionend', clear);
    }

    this.widget.style.left = left + 'px';
    this.widget.style.top = top + 'px';

    if (this._isOpen) this._updatePanelPosition();
  }

  _onPointerDown(e) {
    this._dragging = true;
    this._moved = false;
    this._startX = e.clientX;
    this._startY = e.clientY;
    const rect = this.widget.getBoundingClientRect();
    this._originX = rect.left;
    this._originY = rect.top;
    this.widget.style.transition = '';
    this.widget.classList.add('dragging');
    this.fabBtn.setPointerCapture(e.pointerId);
    if (this._isOpen) this.close();
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this._moved = true;

    const nx = this._clamp(
      this._originX + dx,
      0,
      window.innerWidth - this.widget.offsetWidth
    );
    const ny = this._clamp(
      this._originY + dy,
      0,
      window.innerHeight - this.widget.offsetHeight
    );

    this.widget.style.left = nx + 'px';
    this.widget.style.top = ny + 'px';
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this.widget.classList.remove('dragging');
    try { this.fabBtn.releasePointerCapture(e.pointerId); } catch (_) {}

    if (this._moved) {
      this._snapToEdge(true);
    } else {
      this.toggle();
    }
  }

  _onResize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = parseFloat(this.widget.style.left) || 0;
    let top = parseFloat(this.widget.style.top) || 0;
    left = this._clamp(left, 0, vw - this.widget.offsetWidth);
    top = this._clamp(top, 0, vh - this.widget.offsetHeight);
    this.widget.style.left = left + 'px';
    this.widget.style.top = top + 'px';
    if (this._isOpen) this._updatePanelPosition();
  }

  _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}
