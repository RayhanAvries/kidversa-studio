export class OperationQueue {
    constructor(dbName = 'KidversaQueue', storeName = 'operations') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.isProcessing = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
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

    async enqueue(operation) {
        if (!this.db) await this.init();

        const entry = {
            id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: operation.type,
            data: operation.data,
            status: 'pending',
            retries: 0,
            maxRetries: operation.maxRetries || 5,
            createdAt: Date.now(),
            lastAttemptAt: null,
            error: null
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
                    await this.updateStatus(operation.id, 'pending', error.message);
                    await this.incrementRetries(operation.id);
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
                if (entry) {
                    entry.status = status;
                    entry.lastAttemptAt = Date.now();
                    if (error) entry.error = error;
                    store.put(entry);
                }
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
                if (entry) {
                    entry.retries++;
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
        return {
            total: all.length,
            pending: all.filter(op => op.status === 'pending').length,
            completed: all.filter(op => op.status === 'completed').length,
            failed: all.filter(op => op.status === 'failed').length
        };
    }
}
