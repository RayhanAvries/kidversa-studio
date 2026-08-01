export class RetryManager {
    constructor(queue, options = {}) {
        this.queue = queue;
        this.retryInterval = null;
        this.retryDelay = options.retryDelay || 30000;
    }

    startBackgroundProcessor(executeFn) {
        if (this.retryInterval) return;

        this.retryInterval = setInterval(async () => {
            if (!navigator.onLine) return;

            const stats = await this.queue.getStats();
            if (stats.pending > 0) {
                await this.queue.process(executeFn);
            }
        }, this.retryDelay);
    }

    stopBackgroundProcessor() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }
    }
}
