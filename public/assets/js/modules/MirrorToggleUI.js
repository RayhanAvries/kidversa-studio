export class MirrorToggleUI {
  constructor(container, options = {}) {
    this.container = container;
    this.onToggle = options.onToggle || (() => {});
    this.iconClass = options.icon || 'fas fa-arrows-alt-h';
    this.label = options.label || 'Mirror';
    this._badge = null;
    this._indicator = null;
    this._statusText = null;
    this._active = false;
    this._build();
  }

  _build() {
    this._badge = document.createElement('div');
    this._badge.className = 'mirror-badge';
    this._badge.setAttribute('role', 'button');
    this._badge.setAttribute('aria-label', `Toggle ${this.label}`);
    this._badge.setAttribute('tabindex', '0');

    this._indicator = document.createElement('span');
    this._indicator.className = 'mirror-indicator';

    const icon = document.createElement('i');
    icon.className = this.iconClass;

    this._statusText = document.createElement('span');
    this._statusText.className = 'mirror-status-text';
    this._statusText.textContent = this.label;

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
      this._statusText.textContent = 'ON';
    } else {
      this._badge.classList.remove('active');
      this._statusText.textContent = this.label;
    }
  }

  getActive() {
    return this._active;
  }

  setActive(active) {
    this._active = active;
    this._updateVisual();
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
