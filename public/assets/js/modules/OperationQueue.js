export class OperationQueue {
    constructor(dbName = 'KidversaQueue', storeName = 'operations') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.isProcessing = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                if (oldVersion < 1 || !db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }

                if (oldVersion < 2 && db.objectStoreNames.contains(this.storeName)) {
                    const tx = event.target.transaction;
                    const store = tx.objectStore(this.storeName);
                    const cursorReq = store.openCursor();
                    cursorReq.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const entry = cursor.value;
                            let needsUpdate = false;
                            if (entry.totalSize === undefined) {
                                entry.totalSize = 0;
                                if (entry.data?.blobBase64) {
                                    const base64Clean = entry.data.blobBase64.split(',')[1] || entry.data.blobBase64;
                                    entry.totalSize = Math.ceil((base64Clean.length * 3) / 4);
                                }
                                needsUpdate = true;
                            }
                            if (entry.uploadedChunks === undefined) { entry.uploadedChunks = 0; needsUpdate = true; }
                            if (entry.totalChunks === undefined) { entry.totalChunks = 0; needsUpdate = true; }
                            if (needsUpdate) store.put(entry);
                            cursor.continue();
                        }
                    };
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async _withStore(mode, callback) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, mode);
            const store = tx.objectStore(this.storeName);
            const result = callback(store);

            if (result instanceof Promise) {
                result.then(resolve, reject);
            } else {
                resolve(result);
            }

            tx.onerror = () => reject(tx.error);
        });
    }

    async enqueue(operation) {
        if (!this.db) await this.init();

        let totalSize = 0;
        if (operation.data?.blobBase64) {
            const base64Clean = operation.data.blobBase64.split(',')[1] || operation.data.blobBase64;
            totalSize = Math.ceil((base64Clean.length * 3) / 4);
        }

        const entry = {
            id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: operation.type,
            data: operation.data,
            status: operation.status || 'pending',
            retries: 0,
            maxRetries: operation.maxRetries || 5,
            createdAt: Date.now(),
            lastAttemptAt: null,
            error: null,
            totalSize: totalSize,
            uploadedChunks: 0,
            totalChunks: 0
        };

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.add(entry);

            request.onsuccess = () => resolve(entry);
            request.onerror = () => reject(request.error);
        });
    }

    async process(executeFn) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const pending = await this.getByStatus('pending');

            for (const operation of pending) {
                if (operation.retries >= operation.maxRetries) {
                    await this.updateStatus(operation.id, 'failed');
                    continue;
                }

                try {
                    await executeFn(operation);
                    await this.updateStatus(operation.id, 'completed');
                } catch (error) {
                    await this._updateStatusAndRetries(operation.id, 'pending', error.message);
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    async getByStatus(status) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(id) {
        return this._withStore('readonly', (store) => {
            const request = store.get(id);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async getNextPending() {
        const pending = await this.getByStatus('pending');
        const captured = await this.getByStatus('captured');
        const all = [...pending, ...captured];
        if (all.length === 0) return null;
        // Sort by createdAt, oldest first
        return all.sort((a, b) => a.createdAt - b.createdAt)[0];
    }

    async countByStatus(status) {
        const items = await this.getByStatus(status);
        return items.length;
    }

    async getTotalPendingCount() {
        const pending = await this.countByStatus('pending');
        const captured = await this.countByStatus('captured');
        return pending + captured;
    }

    async getAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateStatus(id, status, error = null) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const entry = getReq.result;
                if (!entry) {
                    console.warn(`[OperationQueue] updateStatus: entry ${id} not found`);
                    resolve();
                    return;
                }
                entry.status = status;
                entry.lastAttemptAt = Date.now();
                entry.error = error;
                store.put(entry);
                resolve();
            };

            getReq.onerror = () => reject(getReq.error);
        });
    }

    async incrementRetries(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const entry = getReq.result;
                if (!entry) {
                    console.warn(`[OperationQueue] incrementRetries: entry ${id} not found`);
                    resolve();
                    return;
                }
                entry.retries++;
                store.put(entry);
                resolve();
            };

            getReq.onerror = () => reject(getReq.error);
        });
    }

    async _updateStatusAndRetries(id, status, error) {
        return this._withStore('readwrite', (store) => {
            const request = store.get(id);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const entry = request.result;
                    if (!entry) {
                        resolve();
                        return;
                    }
                    entry.status = status;
                    entry.lastAttemptAt = Date.now();
                    entry.error = error || null;
                    entry.retries = (entry.retries || 0) + 1;
                    const putRequest = store.put(entry);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    async updateProgress(id, progress) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const entry = getReq.result;
                if (entry) {
                    if (progress.uploadedChunks !== undefined) entry.uploadedChunks = progress.uploadedChunks;
                    if (progress.totalChunks !== undefined) entry.totalChunks = progress.totalChunks;
                    store.put(entry);
                }
                resolve();
            };

            getReq.onerror = () => reject(getReq.error);
        });
    }

    async remove(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearCompleted() {
        const completed = await this.getByStatus('completed');
        for (const op of completed) {
            await this.remove(op.id);
        }
    }

    async getStats() {
        const all = await this.getAll();
        const stats = {
            total: all.length,
            pending: 0,
            completed: 0,
            failed: 0,
            totalSize: 0,
            pendingSize: 0,
            completedSize: 0,
            failedSize: 0
        };

        for (const op of all) {
            stats[op.status] = (stats[op.status] || 0) + 1;
            stats.totalSize += op.totalSize || 0;
            if (op.status === 'pending') stats.pendingSize += op.totalSize || 0;
            if (op.status === 'completed') stats.completedSize += op.totalSize || 0;
            if (op.status === 'failed') stats.failedSize += op.totalSize || 0;
        }

        return stats;
    }
}
