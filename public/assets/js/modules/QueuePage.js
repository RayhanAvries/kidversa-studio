import { OperationQueue } from './OperationQueue.js';

export class QueuePage {
    constructor() {
        this.queue = new OperationQueue();
        this.items = [];
        this.serverStatus = {};
        this.csrfToken = null;
    }

    async init() {
        await this._refreshCsrfToken();

        await this.queue.init();
        await this.loadQueue();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autoretry') === '1') {
            await this._autoRetryRecent();
        }

        document.getElementById('queueClearAll')?.addEventListener('click', () => this.clearAll());
    }

    async _refreshCsrfToken() {
        try {
            const csrfRes = await fetch('api/csrf-token.php', { cache: 'no-store' });
            if (csrfRes.ok) {
                const data = await csrfRes.json();
                this.csrfToken = data.token;
                console.log('[Queue] CSRF token loaded');
            } else {
                console.warn('[Queue] CSRF token fetch failed:', csrfRes.status);
            }
        } catch (e) {
            console.warn('[Queue] Failed to load CSRF token:', e);
        }
    }

    async loadQueue() {
        const list = document.getElementById('queueList');
        const empty = document.getElementById('queueEmpty');
        const content = document.getElementById('queueContent');

        if (content) content.style.display = 'none';
        if (empty) empty.style.display = 'none';

        this.items = await this.queue.getAll();

        if (this.items.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }

        if (content) content.style.display = 'block';

        const filenames = this.items
            .filter(op => op.data?.filename)
            .map(op => op.data.filename);

        if (filenames.length > 0) {
            try {
                const res = await fetch('api/check-queue.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store',
                    body: JSON.stringify({
                        filenames: filenames,
                        csrf_token: this.csrfToken
                    })
                });
                const data = await res.json();
                if (data.success && data.results) {
                    data.results.forEach(r => {
                        this.serverStatus[r.filename] = r.exists;
                    });
                }
            } catch (e) {
                console.error('[Queue] Server check failed:', e);
            }
        }

        this._renderQueue();
    }

    _renderQueue() {
        const list = document.getElementById('queueList');
        if (!list) return;
        list.innerHTML = '';

        const sorted = [...this.items].sort((a, b) => {
            const order = { pending: 0, failed: 1, completed: 2 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });

        sorted.forEach(item => {
            const el = this._createItemElement(item);
            list.appendChild(el);
        });
    }

    _createItemElement(item) {
        const el = document.createElement('div');
        el.className = 'queue-item';

        const filename = item.data?.filename || item.id;
        const exists = this.serverStatus[filename];
        const displayStatus = exists ? 'verified' : item.status;
        const retryPct = Math.round((item.retries / item.maxRetries) * 100);

        const thumbUrl = exists ? `uploads/photos/${filename}` : '';

        el.innerHTML = `
            <div class="queue-item-header">
                ${thumbUrl
                    ? `<img class="queue-item-thumb" src="${thumbUrl}" alt="" onerror="this.style.display='none'">`
                    : `<div class="queue-item-thumb" style="display:flex;align-items:center;justify-content:center;color:#d1d5db;"><i class="fas fa-image" style="font-size:0.8rem;"></i></div>`
                }
                <div class="queue-item-info">
                    <div class="queue-item-name" title="${filename}">${filename}</div>
                    <div class="queue-item-status ${displayStatus}">${this._statusLabel(displayStatus, item.retries, item.maxRetries)}</div>
                </div>
            </div>
            <div class="queue-progress-bar">
                <div class="queue-progress-fill ${displayStatus}" style="width: ${displayStatus === 'completed' || displayStatus === 'verified' ? 100 : retryPct}%"></div>
            </div>
            ${item.error ? `<div class="queue-item-error"><i class="fas fa-exclamation-circle"></i> ${item.error}</div>` : ''}
            ${displayStatus === 'pending' || displayStatus === 'failed' ? `
            <div class="queue-item-actions">
                <button class="queue-btn-retry" data-id="${item.id}"><i class="fas fa-redo"></i> Retry</button>
            </div>` : ''}
        `;

        const retryBtn = el.querySelector('.queue-btn-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryItem(item.id));
        }

        return el;
    }

    _statusLabel(status, retries, maxRetries) {
        switch (status) {
            case 'pending': return `Antrian (${retries}/${maxRetries})`;
            case 'failed': return `Gagal (${retries}/${maxRetries})`;
            case 'completed': return 'Selesai';
            case 'verified': return 'Terverifikasi di server';
            default: return status;
        }
    }

    async retryItem(id) {
        const item = this.items.find(op => op.id === id);
        if (!item) return;

        // Refresh CSRF token before each retry attempt
        await this._refreshCsrfToken();
        if (!this.csrfToken) {
            console.error('[Queue] Cannot retry — no CSRF token available');
            return;
        }

        const btn = document.querySelector(`.queue-btn-retry[data-id="${id}"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Retrying...';
        }

        try {
            if (item.type === 'save_photo' && item.data?.blobBase64) {
                const { ChunkUploader } = await import('./ChunkUploader.js');
                const uploader = new ChunkUploader();

                const arr = item.data.blobBase64.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) u8arr[n] = bstr.charCodeAt(n);
                const blob = new Blob([u8arr], { type: mime });

                const location = item.data.location || { lat: -6.9175, lng: 107.6191, name: 'Bandung' };
                const result = await uploader.upload(blob, item.data.filename, this.csrfToken, location, () => {});

                if (result?.success) {
                    await this.queue.updateStatus(id, 'completed');
                    const serverExists = await this._checkSingleFile(item.data.filename);
                    this.serverStatus[item.data.filename] = serverExists;
                } else {
                    throw new Error(result?.message || 'Upload failed');
                }
            } else if (item.type === 'send_email') {
                const res = await fetch('api/send-email.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...item.data,
                        csrf_token: this.csrfToken
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Email send failed');
                await this.queue.updateStatus(id, 'completed');
            } else {
                throw new Error('Unknown operation type');
            }

            await this.loadQueue();
        } catch (e) {
            console.error('[Queue] Retry failed:', e);
            await this.queue.updateStatus(id, 'pending', e.message);
            await this.queue.incrementRetries(id);
            await this.loadQueue();
        }
    }

    async _checkSingleFile(filename) {
        try {
            const res = await fetch(`api/check-photo.php?filename=${encodeURIComponent(filename)}`);
            const data = await res.json();
            return data.exists || false;
        } catch {
            return false;
        }
    }

    async clearAll() {
        const all = await this.queue.getAll();
        for (const item of all) {
            if (item.status === 'completed' || item.status === 'failed') {
                await this.queue.remove(item.id);
            }
        }
        await this.loadQueue();
    }

    async _autoRetryRecent() {
        const all = await this.queue.getAll();
        const pending = all
            .filter(op => op.status === 'pending' || op.status === 'failed')
            .sort((a, b) => b.createdAt - a.createdAt);

        if (pending.length === 0) return;

        const mostRecent = pending[0];
        await this.retryItem(mostRecent.id);

        const url = new URL(window.location);
        url.searchParams.delete('autoretry');
        window.history.replaceState({}, '', url);
    }
}
