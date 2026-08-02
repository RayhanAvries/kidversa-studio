import { OperationQueue, STATUS_CAPTURED } from "./OperationQueue.js";
import { Config } from "./Config.js";

export class QueuePage {
	constructor() {
		this.queue = new OperationQueue();
		this.items = [];
		this.filteredItems = [];
		this.serverStatus = {};
		this.csrfToken = null;
		this.activeFilter = "all";
		this.selectedIds = new Set();
		this.uploadProgress = {};
		this._pollInterval = null;
	}

	async init() {
		await this._refreshCsrfToken();
		await this.queue.init();
		this._bindFilterTabs();
		this._bindFooterActions();

		await this.loadQueue();

		await this._processCapturedItems();

		this._startPolling();

		window.addEventListener("beforeunload", () => this.destroy());

		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get("autoretry") === "1") {
			await this._autoRetryRecent();
		}
	}

	_startPolling() {
		this._pollInterval = setInterval(async () => {
			await this._refreshStats();
			await this.loadQueue();
		}, 5000);
	}

	destroy() {
		if (this._pollInterval) {
			clearInterval(this._pollInterval);
			this._pollInterval = null;
		}
	}

	async _refreshCsrfToken() {
		try {
			const csrfRes = await fetch("api/csrf-token.php", { cache: "no-store" });
			if (csrfRes.ok) {
				const data = await csrfRes.json();
				this.csrfToken = data.token;
			} else {
				console.warn("[Queue] CSRF token fetch failed:", csrfRes.status);
			}
		} catch (e) {
			console.warn("[Queue] Failed to load CSRF token:", e);
		}
	}

	_bindFilterTabs() {
		const filtersEl = document.getElementById("queueFilters");
		if (!filtersEl) return;

		filtersEl.addEventListener("click", (e) => {
			const btn = e.target.closest(".queue-filter-btn");
			if (!btn) return;

			filtersEl
				.querySelectorAll(".queue-filter-btn")
				.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			this.activeFilter = btn.dataset.filter;
			this._applyFilter();
		});
	}

	_bindFooterActions() {
		document
			.getElementById("queueSelectAll")
			?.addEventListener("click", () => this._selectAll());
		document
			.getElementById("queueDeleteSelected")
			?.addEventListener("click", () => this._deleteSelected());
	}

	_selectAll() {
		const visibleIds = this.filteredItems.map((i) => i.id);
		const allSelected = visibleIds.every((id) => this.selectedIds.has(id));

		if (allSelected) {
			visibleIds.forEach((id) => this.selectedIds.delete(id));
		} else {
			visibleIds.forEach((id) => this.selectedIds.add(id));
		}
		this._updateSelectionUI();
	}

	async _deleteSelected() {
		if (this.selectedIds.size === 0) return;

		for (const id of this.selectedIds) {
			await this.queue.remove(id);
		}
		this.selectedIds.clear();
		await this.loadQueue();
	}

	_toggleSelect(id) {
		if (this.selectedIds.has(id)) {
			this.selectedIds.delete(id);
		} else {
			this.selectedIds.add(id);
		}
		this._updateSelectionUI();
	}

	_updateSelectionUI() {
		const deleteBtn = document.getElementById("queueDeleteSelected");
		const selectAllBtn = document.getElementById("queueSelectAll");
		const deleteCount = document.getElementById("queueDeleteCount");
		const visibleIds = this.filteredItems.map((i) => i.id);
		const allSelected =
			visibleIds.length > 0 &&
			visibleIds.every((id) => this.selectedIds.has(id));

		if (deleteBtn) {
			deleteBtn.disabled = this.selectedIds.size === 0;
		}
		if (selectAllBtn) {
			selectAllBtn.innerHTML = allSelected
				? '<i class="fas fa-times-double"></i> Batal Pilih'
				: '<i class="fas fa-check-double"></i> Pilih Semua';
		}
		if (deleteCount) {
			deleteCount.textContent =
				this.selectedIds.size > 0 ? `(${this.selectedIds.size})` : "";
		}

		document.querySelectorAll(".queue-item").forEach((el) => {
			const cb = el.querySelector(".queue-checkbox");
			const id = el.dataset.id;
			if (cb) cb.checked = this.selectedIds.has(id);
			el.classList.toggle("selected", this.selectedIds.has(id));
		});
	}

	async loadQueue() {
		const empty = document.getElementById("queueEmpty");
		const content = document.getElementById("queueContent");
		const stats = document.getElementById("queueStats");
		const filters = document.getElementById("queueFilters");
		const footer = document.getElementById("queueFooter");

		if (content) content.style.display = "none";
		if (empty) empty.style.display = "none";

		this.items = await this.queue.getAll();

		if (this.items.length === 0) {
			if (empty) empty.style.display = "flex";
			if (stats) stats.style.display = "none";
			if (filters) filters.style.display = "none";
			if (footer) footer.style.display = "none";
			return;
		}

		if (content) content.style.display = "block";
		if (stats) stats.style.display = "block";
		if (filters) filters.style.display = "flex";
		if (footer) footer.style.display = "block";

		await this._checkServerStatus();
		await this._clearStaleErrors();
		this._applyFilter();
		this._refreshStats();
	}

	async _clearStaleErrors() {
		const stale = this.items.filter(
			(i) => (i.status === "completed" || i.status === "verified") && i.error,
		);
		for (const item of stale) {
			await this.queue.updateStatus(item.id, item.status);
		}
	}

	async _checkServerStatus() {
		const filenames = this.items
			.filter((op) => op.data?.filename)
			.map((op) => op.data.filename);

		if (filenames.length === 0) return;

		try {
			const res = await fetch("api/check-queue.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({
					filenames: filenames,
					csrf_token: this.csrfToken,
				}),
			});
			const data = await res.json();
			if (data.success && data.results) {
				data.results.forEach((r) => {
					this.serverStatus[r.filename] = r.exists;
				});
			}
		} catch (e) {
			console.error("[Queue] Server check failed:", e);
		}
	}

	_applyFilter() {
		if (this.activeFilter === "all") {
			this.filteredItems = [...this.items];
		} else {
			this.filteredItems = this.items.filter(
				(i) => i.status === this.activeFilter,
			);
		}
		this._renderQueue();
	}

	async _refreshStats() {
		const stats = await this.queue.getStats();

		const set = (id, val) => {
			const el = document.getElementById(id);
			if (el) el.textContent = val;
		};

		set("statTotal", stats.total);
		set("statTotalSize", this._formatSize(stats.totalSize));
		set("statPending", stats.pending);
		set("statCompleted", stats.completed);
		set("statFailed", stats.failed);
	}

	_renderQueue() {
		const list = document.getElementById("queueList");
		if (!list) return;
		list.innerHTML = "";

		const sorted = [...this.filteredItems].sort((a, b) => {
			const order = {
				captured: 0,
				pending: 1,
				uploading: 2,
				failed: 3,
				completed: 4,
			};
			return (order[a.status] ?? 5) - (order[b.status] ?? 5);
		});

		sorted.forEach((item) => {
			const el = this._createItemElement(item);
			list.appendChild(el);
		});

		this._updateSelectionUI();
	}

	_createItemElement(item) {
		const el = document.createElement("div");
		el.className = "queue-item";
		el.dataset.id = item.id;

		const filename = item.data?.filename || item.id;
		const exists = this.serverStatus[filename];
		const displayStatus = exists ? "verified" : item.status;

		const thumbUrl = exists ? `uploads/photos/${filename}` : "";

		const sizeStr = item.totalSize ? this._formatSize(item.totalSize) : "";
		const typeLabel = item.type === "send_email" ? "Email" : "Foto";
		const typeIcon = item.type === "send_email" ? "fa-envelope" : "fa-camera";

		el.innerHTML = `
            <label class="queue-item-select">
                <input type="checkbox" class="queue-checkbox" data-id="${item.id}" ${this.selectedIds.has(item.id) ? "checked" : ""}>
                <span class="queue-checkmark"></span>
            </label>
            <div class="queue-item-main">
                <div class="queue-item-header">
                    ${
											thumbUrl
												? `<img class="queue-item-thumb" src="${thumbUrl}" alt="" onerror="this.parentElement.querySelector('.queue-item-thumb-placeholder').style.display='flex';this.style.display='none'">`
												: ""
										}
                    <div class="queue-item-thumb-placeholder" ${thumbUrl ? 'style="display:none"' : ""}>
                        <i class="fas ${typeIcon}"></i>
                    </div>
                    <div class="queue-item-info">
                        <div class="queue-item-name" title="${this._escapeAttr(filename)}">
                            <span class="queue-item-type-badge ${displayStatus}">${typeLabel}</span>
                            ${this._escapeHtml(filename)}
                        </div>
                        <div class="queue-item-meta">
                            <span class="queue-item-status ${displayStatus}">${this._statusLabel(displayStatus, item.retries, item.maxRetries)}</span>
                            ${sizeStr ? `<span class="queue-item-size">${sizeStr}</span>` : ""}
                            ${item.type === "save_photo" ? `<span class="queue-item-chunks">${this._getChunkInfo(item)}</span>` : ""}
                        </div>
                    </div>
                </div>
                <div class="queue-progress-bar">
                    <div class="queue-progress-fill ${displayStatus}" style="width: ${this._getProgressWidth(item, displayStatus)}%"></div>
                </div>
                ${this._renderProgressText(item, displayStatus)}
                ${item.error && displayStatus !== "completed" && displayStatus !== "verified" ? `<div class="queue-item-error"><i class="fas fa-exclamation-circle"></i> ${this._escapeHtml(item.error)}</div>` : ""}
                <div class="queue-item-actions">
                    ${
											displayStatus === "pending" || displayStatus === "failed"
												? `
                        <button class="queue-btn-retry" data-id="${item.id}">
                            <i class="fas fa-redo"></i> Retry
                        </button>`
												: ""
										}
                    <button class="queue-btn-remove-single" data-id="${item.id}" title="Hapus dari antrian">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

		const checkbox = el.querySelector(".queue-checkbox");
		if (checkbox) {
			checkbox.addEventListener("change", () => this._toggleSelect(item.id));
		}

		const retryBtn = el.querySelector(".queue-btn-retry");
		if (retryBtn) {
			retryBtn.addEventListener("click", () => this.retryItem(item.id));
		}

		const removeBtn = el.querySelector(".queue-btn-remove-single");
		if (removeBtn) {
			removeBtn.addEventListener("click", async () => {
				await this.queue.remove(item.id);
				this.selectedIds.delete(item.id);
				await this.loadQueue();
			});
		}

		return el;
	}

	_getUploadPercent(item) {
		if (item.totalChunks > 0 && item.uploadedChunks > 0) {
			return Math.round((item.uploadedChunks / item.totalChunks) * 100);
		}
		return 0;
	}

	_getProgressWidth(item, status) {
		if (status === "completed" || status === "verified") return 100;
		if (status === "failed") {
			return Math.min(Math.round((item.retries / item.maxRetries) * 100), 95);
		}
		const uploadPct = this._getUploadPercent(item);
		if (uploadPct > 0) return uploadPct;
		return Math.min(Math.round((item.retries / item.maxRetries) * 10), 10);
	}

	_getChunkInfo(item) {
		if (item.uploadedChunks > 0 && item.totalChunks > 0) {
			return `${item.uploadedChunks}/${item.totalChunks} chunks`;
		}
		return "";
	}

	_renderProgressText(item, status) {
		if (status === "completed" || status === "verified") return "";
		if (item.type !== "save_photo") return "";
		if (!item.totalSize) return "";

		const uploadPct = this._getUploadPercent(item);
		if (uploadPct > 0) {
			const uploadedBytes = Math.round((item.totalSize * uploadPct) / 100);
			const remaining = item.totalSize - uploadedBytes;
			return `<div class="queue-progress-text">
                <span>${uploadPct}% — ${this._formatSize(uploadedBytes)} / ${this._formatSize(item.totalSize)}</span>
                <span>${this._formatSize(remaining)} tersisa</span>
            </div>`;
		}

		return `<div class="queue-progress-text">
            <span>Menunggu upload...</span>
            <span>${this._formatSize(item.totalSize)}</span>
        </div>`;
	}

	_statusLabel(status, retries, maxRetries) {
		switch (status) {
			case STATUS_CAPTURED:
				return "Siap upload";
			case "uploading":
				return "Uploading...";
			case "pending":
				return `Antrian (${retries}/${maxRetries || 5})`;
			case "failed":
				return `Gagal (${retries}/${maxRetries || 5})`;
			case "completed":
				return "Selesai";
			case "verified":
				return "Terverifikasi di server";
			default:
				return status;
		}
	}

	_formatSize(bytes) {
		if (!bytes || bytes === 0) return "0 B";
		const units = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0) + " " + units[i];
	}

	_escapeHtml(str) {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}

	_escapeAttr(str) {
		return str
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	async retryItem(id) {
		const item = this.items.find((op) => op.id === id);
		if (!item) return;

		if (item.retries >= (item.maxRetries || 5)) {
			console.warn("[Queue] maxRetries reached for", id);
			return;
		}

		await this._refreshCsrfToken();
		if (!this.csrfToken) {
			console.error("[Queue] Cannot retry — no CSRF token available");
			return;
		}

		const btn = document.querySelector(`.queue-btn-retry[data-id="${id}"]`);
		if (btn) {
			btn.disabled = true;
			btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Retrying...';
		}

		try {
			if (item.type === "save_photo" && item.data?.blobBase64) {
				const { ChunkUploader } = await import("./ChunkUploader.js");
				const uploader = new ChunkUploader();

				const arr = item.data.blobBase64.split(",");
				const mime = arr[0].match(/:(.*?);/)[1];
				const bstr = atob(arr[1]);
				let n = bstr.length;
				const u8arr = new Uint8Array(n);
				while (n--) u8arr[n] = bstr.charCodeAt(n);
				const blob = new Blob([u8arr], { type: mime });

				const totalChunks = Math.ceil(blob.size / uploader.chunkSize);
				await this.queue.updateProgress(id, { totalChunks, uploadedChunks: 0 });

				const location = item.data.location || {
					lat: Config.get("geolocation.defaultLat", -6.9175),
					lng: Config.get("geolocation.defaultLng", 107.6191),
					name: Config.get("geolocation.defaultName", "Bandung"),
				};
				const result = await uploader.upload(
					blob,
					item.data.filename,
					this.csrfToken,
					location,
					async (progress) => {
						await this.queue.updateProgress(id, {
							uploadedChunks: progress.chunk,
							totalChunks: progress.totalChunks,
						});
						this.uploadProgress[id] = progress;
						this._updateItemProgress(id, progress);
					},
				);

				if (result?.success) {
					await this.queue.updateStatus(id, "completed");
					await this.queue.updateProgress(id, {
						uploadedChunks: totalChunks,
						totalChunks,
					});
					const serverExists = await this._checkSingleFile(item.data.filename);
					this.serverStatus[item.data.filename] = serverExists;
				} else {
					throw new Error(result?.message || "Upload failed");
				}
			} else if (item.type === "send_email") {
				const res = await fetch("api/send-email.php", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...item.data,
						csrf_token: this.csrfToken,
					}),
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.message || "Email send failed");
				await this.queue.updateStatus(id, "completed");
			} else {
				throw new Error("Unknown operation type");
			}

			delete this.uploadProgress[id];
			await this.loadQueue();
		} catch (e) {
			console.error("[Queue] Retry failed:", e);
			await this.queue.updateStatus(id, "pending", e.message);
			await this.queue.incrementRetries(id);
			delete this.uploadProgress[id];
			await this.loadQueue();
		}
	}

	_updateItemProgress(id, progress) {
		const el = document.querySelector(`.queue-item[data-id="${id}"]`);
		if (!el) return;

		const fill = el.querySelector(".queue-progress-fill");
		if (fill) fill.style.width = `${progress.percent}%`;

		const progressText = el.querySelector(".queue-progress-text");
		if (progressText) {
			const item = this.items.find((i) => i.id === id);
			if (item && item.totalSize) {
				const uploadedBytes = Math.round(
					(item.totalSize * progress.percent) / 100,
				);
				const remaining = item.totalSize - uploadedBytes;
				progressText.innerHTML = `
                    <span>${progress.percent}% — ${this._formatSize(uploadedBytes)} / ${this._formatSize(item.totalSize)}</span>
                    <span>${this._formatSize(remaining)} tersisa</span>
                `;
			}
		}

		const chunkInfo = el.querySelector(".queue-item-chunks");
		if (chunkInfo) {
			chunkInfo.textContent = `${progress.chunk}/${progress.totalChunks} chunks`;
		}
	}

	async _processCapturedItems() {
		const all = this.items;
		const needsRetry = all.filter(
			(i) => i.status === STATUS_CAPTURED || i.status === "uploading",
		);

		if (needsRetry.length === 0) return;

		for (const item of needsRetry) {
			await this.queue.updateStatus(item.id, STATUS_CAPTURED);
		}

		await this.loadQueue();
		await this._autoRetryRecent();
	}

	async _checkSingleFile(filename) {
		try {
			const res = await fetch(
				`api/check-photo.php?filename=${encodeURIComponent(filename)}`,
			);
			const data = await res.json();
			return data.exists || false;
		} catch {
			return false;
		}
	}

	async _autoRetryRecent() {
		const all = await this.queue.getAll();
		const pending = all
			.filter(
				(op) =>
					op.status === "pending" ||
					op.status === "failed" ||
					op.status === STATUS_CAPTURED,
			)
			.sort((a, b) => b.createdAt - a.createdAt);

		if (pending.length === 0) return;

		const mostRecent = pending[0];
		await this.retryItem(mostRecent.id);

		const url = new URL(window.location);
		url.searchParams.delete("autoretry");
		window.history.replaceState({}, "", url);
	}
}
