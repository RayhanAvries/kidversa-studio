export class RetryManager {
    constructor(queue) {
        this.queue = queue;
        this.retryInterval = null;
        this.retryDelay = 30000;
    }

    async execute(operation, fn) {
        try {
            const result = await fn();
            return result;
        } catch (error) {
            console.warn('[RetryManager] Operation failed, enqueuing for retry:', error.message);
            await this.queue.enqueue(operation);
            throw error;
        }
    }

    startBackgroundProcessor(executeFn) {
        if (this.retryInterval) return;

        this.retryInterval = setInterval(async () => {
            const stats = await this.queue.getStats();
            if (stats.pending > 0) {
                // removed debug log
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
