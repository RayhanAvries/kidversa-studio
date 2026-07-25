export class ChunkUploader {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 512 * 1024;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
    }

    async upload(blob, filename, csrfToken, location, onProgress) {
        const totalChunks = Math.ceil(blob.size / this.chunkSize);
        const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        await this.initSession(uploadId, filename, totalChunks, blob.size, csrfToken);

        let uploadedChunks = 0;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, blob.size);
            const chunkBlob = blob.slice(start, end);

            await this.uploadChunkWithRetry(uploadId, i, chunkBlob, this.maxRetries);

            uploadedChunks++;
            if (onProgress) {
                onProgress({
                    loaded: uploadedChunks * this.chunkSize,
                    total: blob.size,
                    percent: Math.round((uploadedChunks / totalChunks) * 100),
                    chunk: uploadedChunks,
                    totalChunks: totalChunks
                });
            }
        }

        return this.completeSession(uploadId, csrfToken, location);
    }

    async initSession(uploadId, filename, totalChunks, totalSize, csrfToken) {
        const res = await fetch('api/chunk-init.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                upload_id: uploadId,
                filename: filename,
                total_chunks: totalChunks,
                total_size: totalSize,
                csrf_token: csrfToken
            })
        });

        if (!res.ok) {
            throw new Error(`Failed to init chunk session: ${res.status}`);
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to init chunk session');
        }

        return data;
    }

    async uploadChunkWithRetry(uploadId, chunkIndex, chunkBlob, retries) {
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await this.uploadChunk(uploadId, chunkIndex, chunkBlob);
                return;
            } catch (e) {
                lastError = e;
                if (attempt < retries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError;
    }

    async uploadChunk(uploadId, chunkIndex, chunkBlob) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('upload_id', uploadId);
            formData.append('chunk_index', chunkIndex);
            formData.append('chunk', chunkBlob, `chunk_${chunkIndex}`);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'api/chunk-upload.php', true);

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.success) {
                            resolve(data);
                        } else {
                            reject(new Error(data.message || 'Chunk upload failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid response from server'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = function () {
                reject(new Error('Network error during chunk upload'));
            };

            xhr.send(formData);
        });
    }

    async completeSession(uploadId, csrfToken, location) {
        const res = await fetch('api/chunk-complete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                upload_id: uploadId,
                csrf_token: csrfToken,
                location_lat: location?.lat,
                location_lng: location?.lng,
                location_name: location?.name
            })
        });

        if (!res.ok) {
            throw new Error(`Failed to complete upload: ${res.status}`);
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to complete upload');
        }

        return data;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
