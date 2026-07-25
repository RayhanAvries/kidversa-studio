export class BlobDownloader {
    static async download(url, filename, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';

            xhr.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percent: Math.round((event.loaded / event.total) * 100)
                    });
                }
            };

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const blob = xhr.response;
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename || 'download';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                    resolve();
                } else {
                    reject(new Error(`Download failed: HTTP ${xhr.status}`));
                }
            };

            xhr.onerror = function () {
                reject(new Error('Network error during download'));
            };

            xhr.send();
        });
    }

    static async downloadWithRetry(url, filename, onProgress, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await BlobDownloader.download(url, filename, onProgress);
                return;
            } catch (e) {
                lastError = e;
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        throw lastError;
    }
}
