export class HandDetectionUI {
  constructor(container, options = {}) {
    this.container = container;
    this.onToggle = options.onToggle || (() => {});
    this._badge = null;
    this._indicator = null;
    this._statusText = null;
    this._active = false;
    this._handDetected = false;
    this._ready = false;
    this._build();
  }

  _build() {
    this._badge = document.createElement('div');
    this._badge.className = 'hand-detect-badge';
    this._badge.setAttribute('role', 'button');
    this._badge.setAttribute('aria-label', 'Toggle hand detection');
    this._badge.setAttribute('tabindex', '0');

    this._indicator = document.createElement('span');
    this._indicator.className = 'hand-indicator';

    const icon = document.createElement('i');
    icon.className = 'fas fa-hand-paper';

    this._statusText = document.createElement('span');
    this._statusText.className = 'hand-status-text';
    this._statusText.textContent = 'Hand';

    this._badge.appendChild(this._indicator);
    this._badge.appendChild(icon);
    this._badge.appendChild(this._statusText);

    this._badge.addEventListener('click', () => this._handleClick());
    this._badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleClick();
      }
    });

    this.container.appendChild(this._badge);
  }

  _handleClick() {
    this._active = !this._active;
    this._updateVisual();
    this.onToggle(this._active);
  }

  _updateVisual() {
    if (this._active) {
      this._badge.classList.add('active');
      this._statusText.textContent = this._ready ? 'ON' : 'Loading...';
    } else {
      this._badge.classList.remove('active');
      this._badge.classList.remove('detected');
      this._badge.classList.remove('loading');
      this._statusText.textContent = 'Hand';
      this._handDetected = false;
    }
  }

  setActive(active) {
    this._active = active;
    this._updateVisual();
  }

  setReady(ready) {
    this._ready = ready;
    if (ready) {
      this._badge.classList.remove('loading');
      if (this._active) {
        this._statusText.textContent = 'ON';
      } else {
        this._statusText.textContent = 'Hand';
      }
    } else {
      this._badge.classList.add('loading');
    }
  }

  setLoading(loading) {
    if (loading) {
      this._badge.classList.add('loading');
      this._badge.classList.add('active');
      this._statusText.textContent = 'Loading...';
      this._indicator.style.background = '#f59e0b';
    } else {
      this._badge.classList.remove('loading');
      this._indicator.style.background = '';
    }
  }

  setHandDetected(detected) {
    this._handDetected = detected;
    if (this._active) {
      if (detected) {
        this._badge.classList.add('detected');
      } else {
        this._badge.classList.remove('detected');
      }
    }
  }

  show() {
    this._badge.style.display = '';
  }

  hide() {
    this._badge.style.display = 'none';
  }

  destroy() {
    if (this._badge && this._badge.parentNode) {
      this._badge.parentNode.removeChild(this._badge);
    }
    this._badge = null;
    this._indicator = null;
    this._statusText = null;
  }
}