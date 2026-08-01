import { STATUS_CAPTURED } from "../modules/OperationQueue.js";

/**
 * UploadProcessor - Background upload worker for Queue-First architecture
 *
 * Polls OperationQueue for captured/pending items and uploads them sequentially.
 * Emits progress events for UI updates.
 */
export class UploadProcessor {
	/**
	 * @param {OperationQueue} operationQueue - Queue instance to poll for items
	 * @param {ChunkUploader} chunkUploader - Uploader instance for chunked uploads
	 * @param {Object} [options]
	 * @param {number} [options.pollInterval=2000] - Polling interval in ms
	 * @param {Function} [options.onProgress] - Called with (operationId, progress) on upload progress
	 * @param {Function} [options.onStatusChange] - Called with (operationId, status, result?) on status changes
	 * @param {Function} [options.onError] - Called with (operationId, error, isPermanent) on errors
	 */
	constructor(operationQueue, chunkUploader, options = {}) {
		this.queue = operationQueue;
		this.uploader = chunkUploader;
		this.pollInterval = options.pollInterval || 2000;
		this.onProgress = options.onProgress || (() => {});
		this.onStatusChange = options.onStatusChange || (() => {});
		this.onError = options.onError || (() => {});

		this._timer = null;
		this._isProcessing = false;
		this._currentOperation = null;

		// Re-enter when browser comes back online
		this._handleOnline = () => this.processNext();
		window.addEventListener("online", this._handleOnline);
	}

	/**
	 * Start polling for pending uploads.
	 * Processes immediately, then on each poll interval.
	 */
	start() {
		if (this._timer) return;
		this._timer = setInterval(() => this.processNext(), this.pollInterval);
		// Process immediately on start
		this.processNext();
	}

	/**
	 * Stop polling and clean up event listeners.
	 */
	stop() {
		if (this._timer) {
			clearInterval(this._timer);
			this._timer = null;
		}
		window.removeEventListener("online", this._handleOnline);

		// Mark any in-flight item as captured so QueuePage can pick it up
		if (this._currentOperation && this._currentOperation.status === "uploading") {
			this.queue.updateStatus(this._currentOperation.id, STATUS_CAPTURED).catch(() => {
				// If update fails, item stays as "uploading" — QueuePage will handle it
			});
		}
	}

	/**
	 * Process the next pending item in the queue.
	 * Skips if already processing, offline, or uploader is busy.
	 */
	async processNext() {
		if (this._isProcessing) return;
		if (!navigator.onLine) return;
		if (this.uploader.isUploading) return;

		this._isProcessing = true;

		try {
			const item = await this.queue.getNextPending();
			if (!item) {
				this._isProcessing = false;
				return;
			}

			this._currentOperation = item;

			// Update status to uploading
			await this.queue.updateStatus(item.id, "uploading");
			this.onStatusChange(item.id, "uploading");

			// Reconstruct blob from stored base64
			const blob = this._base64ToBlob(item.data.blobBase64);

			// Upload via chunk uploader
			const result = await this.uploader.upload(
				blob,
				item.data.filename,
				item.data.csrfToken,
				item.data.location,
				(progress) => {
					// Track chunk progress in the queue
					this.queue.updateProgress(item.id, {
						uploadedChunks: progress.chunk,
						totalChunks: progress.totalChunks,
					});
					this.onProgress(item.id, progress);
				},
			);

			// Mark as completed
			await this.queue.updateStatus(item.id, "completed");
			this.onStatusChange(item.id, "completed", result);
		} catch (error) {
			console.error("[UploadProcessor] Upload failed:", error);

			if (this._currentOperation) {
				const item = this._currentOperation;

				if (error.message === "Upload cancelled") {
					// Cancelled by user — revert to captured status for later retry
					await this.queue.updateStatus(item.id, STATUS_CAPTURED);
					this.onStatusChange(item.id, STATUS_CAPTURED);
				} else if (item.retries >= (item.maxRetries || 5)) {
					// Max retries exceeded — permanent failure
					await this.queue.updateStatus(item.id, "failed", error.message);
					this.onStatusChange(item.id, "failed");
					this.onError(item.id, error, true);
				} else {
					// Increment retries and mark pending for next poll cycle
					await this.queue._updateStatusAndRetries(
						item.id,
						"pending",
						error.message,
					);
					this.onStatusChange(item.id, "pending");
					this.onError(item.id, error, false);
				}
			}
		} finally {
			this._currentOperation = null;
			this._isProcessing = false;
		}
	}

	/**
	 * Cancel the currently uploading item.
	 */
	cancelCurrent() {
		if (this.uploader.isUploading) {
			this.uploader.cancel();
		}
	}

	/**
	 * Check if the processor is currently uploading.
	 * @returns {boolean}
	 */
	get isProcessing() {
		return this._isProcessing;
	}

	/**
	 * Get the current operation being processed.
	 * @returns {Object|null}
	 */
	get currentOperation() {
		return this._currentOperation;
	}

	/**
	 * Convert a base64 data URL to a Blob.
	 * @param {string} base64 - Data URL string (e.g. "data:image/png;base64,...")
	 * @returns {Blob}
	 */
	_base64ToBlob(base64) {
		const parts = base64.split(",");
		const mime = parts[0].match(/:(.*?);/)[1];
		const byteString = atob(parts[1]);
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}
		return new Blob([ab], { type: mime });
	}
}
