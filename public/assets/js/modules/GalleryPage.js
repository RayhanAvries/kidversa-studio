import { SharedActions } from "./SharedActions.js";
import { OperationQueue } from "./OperationQueue.js";
import { Config } from "./Config.js";
import { Lang } from "./Lang.js";
import { BlobDownloader } from "./BlobDownloader.js";

export class GalleryPage {
	constructor() {
		this.photos = [];
		this.selectedFilename = null;
		this.csrfToken = null;
		this.currentPage = 1;
		this.totalPages = 1;
		this.totalPhotos = 0;
		this.totalSize = 0;
		this.perPage = 25;
		this.printModal = document.getElementById("printModal");
		this.qrModal = document.getElementById("qrModal");
		this.emailModal = document.getElementById("emailModal");
		this.operationQueue = new OperationQueue();

		// Countdown timer state
		this._countdownRafId = null;
		this._lastCountdownTick = 0;
		this._countdownElements = new Map(); // filename -> { badge, labelEl, textEl, progressBar, expiresAt, card }
	}

	async init() {
		try {
			const csrfRes = await fetch("api/csrf-token.php");
			if (csrfRes.ok) {
				const data = await csrfRes.json();
				this.csrfToken = data.token;
			}
		} catch (e) {
			console.warn("[Gallery] Failed to load CSRF token:", e);
		}

		this._bindModalEvents();
		await this.operationQueue.init();
		await this.loadPhotos();

		// Cleanup countdown timer when page unloads
		window.addEventListener("beforeunload", () => this._stopCountdownTimer());

		// Cleanup when visibility changes (tab switching)
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				// Only stop rAF, preserve Map for restart
				if (this._countdownRafId) {
					cancelAnimationFrame(this._countdownRafId);
					this._countdownRafId = null;
				}
			} else if (this._countdownElements.size > 0) {
				this._startCountdownTimer();
			}
		});
	}

	async loadPhotos(page = 1) {
		// Stop existing countdown timer before loading new data
		this._stopCountdownTimer();

		const grid = document.getElementById("galleryGrid");
		const empty = document.getElementById("galleryEmpty");
		const loading = document.getElementById("galleryLoading");
		const stats = document.getElementById("galleryStats");
		const pagination = document.getElementById("galleryPagination");

		if (loading) loading.style.display = "flex";
		if (grid) grid.style.display = "none";
		if (empty) empty.style.display = "none";
		if (stats) stats.style.display = "none";
		if (pagination) pagination.style.display = "none";

		try {
			const res = await fetch(
				`api/list-photos.php?page=${page}&per_page=${this.perPage}`,
			);
			const data = await res.json();

			if (loading) loading.style.display = "none";

			if (data.success && data.photos.length > 0) {
				this.photos = data.photos;
				this.currentPage = data.page;
				this.totalPages = data.total_pages;
				this.totalPhotos = data.total;
				this.totalSize = data.total_size;
				this._renderGrid(data.photos);
				this._renderStats(data);
				this._renderPagination();
				if (grid) grid.style.display = "grid";
				if (stats) stats.style.display = "block";
				if (pagination)
					pagination.style.display = data.total_pages > 1 ? "flex" : "none";
			} else {
				if (empty) empty.style.display = "flex";
			}
		} catch (e) {
			console.error("[Gallery] Failed to load photos:", e);
			if (loading) {
				loading.textContent = "";
				const errorIcon = document.createElement("i");
				errorIcon.className = "fas fa-exclamation-triangle";
				loading.appendChild(errorIcon);
				loading.appendChild(document.createTextNode(" Gagal memuat foto"));
			}
		}
	}

	_renderGrid(photos) {
		const grid = document.getElementById("galleryGrid");
		if (!grid) return;
		while (grid.firstChild) {
			grid.removeChild(grid.firstChild);
		}

		// Clear previous countdown tracking
		this._stopCountdownTimer();

		photos.forEach((photo) => {
			const card = document.createElement("div");
			card.className = "gallery-card";
			card.dataset.filename = photo.filename;

			const img = document.createElement("img");
			img.className = "gallery-card-img";
			img.src = photo.url;
			img.alt = photo.filename;
			img.loading = "lazy";

			const actions = document.createElement("div");
			actions.className = "gallery-card-actions";

			const renameBtn = document.createElement("button");
			renameBtn.className = "gallery-action-btn gallery-action-rename";
			const renameIcon = document.createElement("i");
			renameIcon.className = "fas fa-pen";
			renameBtn.appendChild(renameIcon);
			renameBtn.title = "Rename";
			renameBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this._startRename(card, photo.filename);
			});

			const deleteBtn = document.createElement("button");
			deleteBtn.className = "gallery-action-btn gallery-action-delete";
			const deleteIcon = document.createElement("i");
			deleteIcon.className = "fas fa-trash";
			deleteBtn.appendChild(deleteIcon);
			deleteBtn.title = "Delete";
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this._showDeleteConfirm(card, photo.filename);
			});

			actions.appendChild(renameBtn);
			actions.appendChild(deleteBtn);

			const info = document.createElement("div");
			info.className = "gallery-card-info";

			const name = document.createElement("div");
			name.className = "gallery-card-name";
			name.textContent = photo.filename;

			const meta = document.createElement("div");
			meta.className = "gallery-card-meta";

			const date = document.createElement("div");
			date.className = "gallery-card-date";
			date.textContent = new Date(photo.modified * 1000).toLocaleString(
				"id-ID",
				{
					day: "numeric",
					month: "short",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				},
			);

			const size = document.createElement("div");
			size.className = "gallery-card-size";
			size.textContent = this._formatSize(photo.size);

			meta.appendChild(date);
			meta.appendChild(size);
			info.appendChild(name);
			info.appendChild(meta);
			card.appendChild(img);
			card.appendChild(actions);
			card.appendChild(info);

			// === COUNTDOWN TIMER ===
			if (photo.expires_at) {
				const countdownBadge = this._renderCountdownBadge(photo);
				card.appendChild(countdownBadge);

				const progressBar = this._renderProgressBar(photo.expires_at);
				card.appendChild(progressBar);

				// Track for live updates (include child refs to avoid querySelector per tick)
				const labelEl = countdownBadge.querySelector(
					".gallery-card-countdown-label",
				);
				const textEl = countdownBadge.querySelector(
					".gallery-card-countdown-text",
				);
				this._countdownElements.set(photo.filename, {
					badge: countdownBadge,
					labelEl: labelEl,
					textEl: textEl,
					progressBar: progressBar,
					expiresAt: photo.expires_at,
					card: card,
				});
			}

			card.addEventListener("click", () => this._selectPhoto(photo.filename));

			grid.appendChild(card);
		});

		// Start global countdown timer if there are photos with expires_at
		if (this._countdownElements.size > 0) {
			this._startCountdownTimer();
		}
	}

	_renderStats(data) {
		const statTotal = document.getElementById("statTotal");
		const statSize = document.getElementById("statSize");
		const statShowing = document.getElementById("statShowing");
		const statOfTotal = document.getElementById("statOfTotal");

		if (statTotal) statTotal.textContent = data.total;
		if (statSize) statSize.textContent = this._formatSize(data.total_size);
		if (statShowing) statShowing.textContent = data.photos.length;
		if (statOfTotal) statOfTotal.textContent = data.total;
	}

	_renderPagination() {
		const container = document.getElementById("galleryPagination");
		if (!container) return;
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		if (this.totalPages <= 1) return;

		const prevBtn = document.createElement("button");
		prevBtn.className = "page-btn";
		const prevIcon = document.createElement("i");
		prevIcon.className = "fas fa-chevron-left";
		prevBtn.appendChild(prevIcon);
		prevBtn.disabled = this.currentPage === 1;
		prevBtn.addEventListener("click", () =>
			this.loadPhotos(this.currentPage - 1),
		);
		container.appendChild(prevBtn);

		const pages = this._getPageNumbers();
		pages.forEach((p) => {
			if (p === "...") {
				const ellipsis = document.createElement("span");
				ellipsis.className = "page-ellipsis";
				ellipsis.textContent = "...";
				container.appendChild(ellipsis);
			} else {
				const btn = document.createElement("button");
				btn.className = "page-btn" + (p === this.currentPage ? " active" : "");
				btn.textContent = p;
				btn.addEventListener("click", () => this.loadPhotos(p));
				container.appendChild(btn);
			}
		});

		const nextBtn = document.createElement("button");
		nextBtn.className = "page-btn";
		const nextIcon = document.createElement("i");
		nextIcon.className = "fas fa-chevron-right";
		nextBtn.appendChild(nextIcon);
		nextBtn.disabled = this.currentPage === this.totalPages;
		nextBtn.addEventListener("click", () =>
			this.loadPhotos(this.currentPage + 1),
		);
		container.appendChild(nextBtn);
	}

	_getPageNumbers() {
		const pages = [];
		const total = this.totalPages;
		const current = this.currentPage;

		if (total <= 7) {
			for (let i = 1; i <= total; i++) pages.push(i);
			return pages;
		}

		pages.push(1);

		if (current > 3) pages.push("...");

		const start = Math.max(2, current - 1);
		const end = Math.min(total - 1, current + 1);

		for (let i = start; i <= end; i++) pages.push(i);

		if (current < total - 2) pages.push("...");

		pages.push(total);
		return pages;
	}

	/**
	 * Format seconds into HH:MM:SS or MM:SS display
	 * @param {number} totalSeconds - remaining seconds (can be 0 or negative)
	 * @returns {string} formatted time string
	 */
	_formatCountdown(totalSeconds) {
		const seconds = Math.max(0, Math.floor(totalSeconds));
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;

		if (h > 0) {
			return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
		}
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}

	/**
	 * Determine urgency level based on remaining seconds
	 * @param {number} secondsLeft - remaining seconds
	 * @returns {'normal'|'warning'|'critical'}
	 */
	_getCountdownUrgency(secondsLeft) {
		if (secondsLeft <= 0) return "critical"; // = 0 triggers fade-out, not persistent state
		if (secondsLeft < 3600) return "critical"; // < 1 hour
		if (secondsLeft < 21600) return "warning"; // < 6 hours
		return "normal"; // >= 6 hours
	}

	/**
	 * Create countdown badge element for a gallery card
	 * @param {Object} photo - photo data from API (must include expires_at)
	 * @returns {HTMLDivElement} countdown badge element
	 */
	_renderCountdownBadge(photo) {
		const badge = document.createElement("div");
		badge.className = "gallery-card-countdown";

		const icon = document.createElement("i");
		icon.className = "fas fa-clock";

		const label = document.createElement("span");
		label.className = "gallery-card-countdown-label";
		label.textContent = Lang.get("countdown.remaining");

		const text = document.createElement("span");
		text.className = "gallery-card-countdown-text";

		badge.appendChild(icon);
		badge.appendChild(label);
		badge.appendChild(text);

		// Set initial state
		const now = Math.floor(Date.now() / 1000);
		const secondsLeft = photo.expires_at - now;
		const urgency = this._getCountdownUrgency(secondsLeft);

		badge.classList.add(`countdown-${urgency}`);
		text.textContent = this._formatCountdown(Math.max(0, secondsLeft));

		return badge;
	}

	/**
	 * Create progress bar element showing time remaining visually
	 * @param {number} expiresAt - Unix timestamp when photo expires
	 * @returns {HTMLDivElement} progress bar container element
	 */
	_renderProgressBar(expiresAt) {
		const container = document.createElement("div");
		container.className = "gallery-card-progress";

		const bar = document.createElement("div");
		bar.className = "gallery-card-progress-bar";

		// Calculate initial width (percentage of 24 hours)
		const totalDuration = parseInt(Config.get("photo.expiry", "86400"), 10);
		const now = Math.floor(Date.now() / 1000);
		const secondsLeft = Math.max(0, expiresAt - now);
		const percentage = Math.min(100, (secondsLeft / totalDuration) * 100);

		bar.style.width = `${percentage}%`;

		// Set initial urgency class
		const urgency = this._getCountdownUrgency(secondsLeft);
		if (urgency === "warning") bar.classList.add("progress-warning");
		else if (urgency === "critical") bar.classList.add("progress-critical");

		container.appendChild(bar);
		return container;
	}

	/**
	 * Start the global countdown update loop using requestAnimationFrame.
	 * Throttled to 1 update per second via timestamp comparison.
	 */
	_startCountdownTimer() {
		// Cancel existing rAF without clearing the Map
		if (this._countdownRafId) {
			cancelAnimationFrame(this._countdownRafId);
			this._countdownRafId = null;
		}

		this._lastCountdownTick = 0;

		const loop = (timestamp) => {
			this._countdownRafId = requestAnimationFrame(loop);

			// Throttle to once per second (1000ms)
			if (timestamp - this._lastCountdownTick < 1000) return;
			this._lastCountdownTick = timestamp;

			this._updateCountdowns();
		};

		this._countdownRafId = requestAnimationFrame(loop);
	}

	/**
	 * Stop the countdown animation frame and clean up tracked elements
	 */
	_stopCountdownTimer() {
		if (this._countdownRafId) {
			cancelAnimationFrame(this._countdownRafId);
			this._countdownRafId = null;
		}
		this._lastCountdownTick = 0;
		this._countdownElements.clear();
	}

	/**
	 * Update all visible countdown badges and progress bars
	 * Removes expired cards from DOM with fade animation
	 */
	_updateCountdowns() {
		const now = Math.floor(Date.now() / 1000);
		const expiredFiles = [];

		this._countdownElements.forEach((elements, filename) => {
			const secondsLeft = elements.expiresAt - now;
			const urgency = this._getCountdownUrgency(secondsLeft);

			// Update badge text and class
			if (elements.badge) {
				// Remove old urgency classes
				elements.badge.classList.remove(
					"countdown-normal",
					"countdown-warning",
					"countdown-critical",
				);
				elements.badge.classList.add(`countdown-${urgency}`);

				// Update countdown text (label is static, set once at render time)
				if (elements.textEl) {
					elements.textEl.textContent = this._formatCountdown(
						Math.max(0, secondsLeft),
					);
				}
			}

			// Update progress bar
			if (elements.progressBar) {
				const totalDuration = parseInt(Config.get("photo.expiry", "86400"), 10);
				const percentage = Math.max(
					0,
					Math.min(100, (secondsLeft / totalDuration) * 100),
				);
				elements.progressBar.style.width = `${percentage}%`;

				// Update progress bar urgency class
				elements.progressBar.classList.remove(
					"progress-warning",
					"progress-critical",
				);
				if (urgency === "warning")
					elements.progressBar.classList.add("progress-warning");
				else if (urgency === "critical")
					elements.progressBar.classList.add("progress-critical");
			}

			// When countdown = 0, trigger fade-out (no persistent expired state)
			// Guard: don't trigger twice if card is already fading out
			if (
				secondsLeft <= 0 &&
				elements.card &&
				!elements.card.classList.contains("card-expiring")
			) {
				expiredFiles.push({ filename, card: elements.card });
			}
		});

		// Remove expired cards with animation
		expiredFiles.forEach(({ filename, card }) => {
			card.classList.add("card-expiring");
			setTimeout(() => {
				card.remove();
				this._countdownElements.delete(filename);

				// Update total count
				this.totalPhotos = Math.max(0, this.totalPhotos - 1);
				const statTotal = document.getElementById("statTotal");
				if (statTotal) statTotal.textContent = this.totalPhotos;

				// Show empty state if no cards left
				const grid = document.getElementById("galleryGrid");
				const empty = document.getElementById("galleryEmpty");
				if (grid && grid.children.length === 0) {
					grid.style.display = "none";
					if (empty) empty.style.display = "flex";
					this._stopCountdownTimer();
				}
			}, 2000); // Wait for fade animation
		});
	}

	_formatSize(bytes) {
		if (bytes === 0) return "0 B";
		const units = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0) + " " + units[i];
	}

	_startRename(card, oldFilename) {
		const nameEl = card.querySelector(".gallery-card-name");
		if (!nameEl || nameEl.classList.contains("editing")) return;

		const baseName = oldFilename.replace(/\.[^.]+$/, "");
		const ext = oldFilename.split(".").pop();

		nameEl.classList.add("editing");
		const input = document.createElement("input");
		input.type = "text";
		input.className = "gallery-rename-input";
		input.value = baseName;
		nameEl.textContent = "";
		nameEl.appendChild(input);
		input.focus();
		input.select();

		let finishing = false;

		const finishRename = async (save) => {
			if (finishing) return;
			finishing = true;

			nameEl.classList.remove("editing");
			if (save) {
				const newName = input.value.trim();
				if (newName && newName !== baseName) {
					await this._renamePhoto(oldFilename, newName + "." + ext);
					return;
				}
			}
			nameEl.textContent = oldFilename;
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") finishRename(true);
			if (e.key === "Escape") finishRename(false);
		});
		input.addEventListener("blur", () => finishRename(true));
	}

	async _renamePhoto(oldFilename, newFilename) {
		try {
			const res = await fetch("api/rename-photo.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					old_filename: oldFilename,
					new_filename: newFilename,
					csrf_token: this.csrfToken,
				}),
			});

			const data = await res.json();
			if (data.success) {
				await this.loadPhotos(this.currentPage);
			} else {
				alert(data.message || "Gagal rename file");
				await this.loadPhotos(this.currentPage);
			}
		} catch (e) {
			console.error("[Gallery] Rename error:", e);
			alert("Gagal rename file. Silakan coba lagi.");
			await this.loadPhotos(this.currentPage);
		}
	}

	_showDeleteConfirm(card, filename) {
		const existing = card.querySelector(".gallery-delete-confirm");
		if (existing) return;

		const overlay = document.createElement("div");
		overlay.className = "gallery-delete-confirm";

		const text = document.createElement("div");
		text.className = "gallery-delete-text";
		text.textContent = "Hapus foto ini?";

		const actions = document.createElement("div");
		actions.className = "gallery-delete-actions";

		const cancelBtn = document.createElement("button");
		cancelBtn.className = "gallery-delete-btn gallery-delete-cancel-btn";
		cancelBtn.textContent = "Batal";
		cancelBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			overlay.remove();
		});

		const confirmBtn = document.createElement("button");
		confirmBtn.className = "gallery-delete-btn gallery-delete-confirm-btn";
		confirmBtn.textContent = "Hapus";
		confirmBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			confirmBtn.disabled = true;
			confirmBtn.textContent = "...";
			await this._deletePhoto(filename);
		});

		actions.appendChild(cancelBtn);
		actions.appendChild(confirmBtn);
		overlay.appendChild(text);
		overlay.appendChild(actions);
		card.appendChild(overlay);
	}

	async _deletePhoto(filename) {
		try {
			const formData = new URLSearchParams();
			formData.append("filename", filename);
			formData.append("csrf_token", this.csrfToken);

			const res = await fetch("api/delete-photo.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formData.toString(),
			});

			const data = await res.json();
			if (data.success) {
				await this.loadPhotos(this.currentPage);
			} else {
				alert(data.message || "Gagal menghapus foto");
				await this.loadPhotos(this.currentPage);
			}
		} catch (e) {
			console.error("[Gallery] Delete error:", e);
			alert("Gagal menghapus foto. Silakan coba lagi.");
			await this.loadPhotos(this.currentPage);
		}
	}

	_selectPhoto(filename) {
		this.selectedFilename = filename;
		this._openPrintModal();
	}

	_openPrintModal() {
		if (!this.printModal || !this.selectedFilename) return;

		const btnHome = document.getElementById("btnHome");
		if (btnHome) btnHome.style.display = "none";

		this.printModal.classList.add("on");
	}

	_bindModalEvents() {
		if (this.printModal) {
			this.printModal.addEventListener("click", (e) => {
				if (e.target === this.printModal) this._closePrintModal();
			});
		}

		document
			.getElementById("btnClosePrint")
			?.addEventListener("click", () => this._closePrintModal());

		document
			.getElementById("btnPrint")
			?.addEventListener("click", () => this._printPhoto());
		document
			.getElementById("btnDownload")
			?.addEventListener("click", () => this._downloadPhoto());
		document
			.getElementById("btnEmailAction")
			?.addEventListener("click", () => this._openEmailModal());
		document
			.getElementById("btnQrAction")
			?.addEventListener("click", () => this._openQRModal());
		document
			.getElementById("btnCloseQr")
			?.addEventListener("click", () => this._closeQRModal());
		document
			.getElementById("btnCloseEmail")
			?.addEventListener("click", () => this._closeEmailModal());
		document
			.getElementById("btnSendEmail")
			?.addEventListener("click", () => this._sendEmail());
	}

	_closePrintModal() {
		this.printModal?.classList.remove("on");
		this.qrModal && (this.qrModal.style.display = "none");

		// Clear email state when closing parent modal
		if (this.emailModal) this.emailModal.style.display = "none";
		const emailError = document.getElementById("emailError");
		const emailInput = document.getElementById("emailInput");
		if (emailError) emailError.style.display = "none";
		if (emailInput) emailInput.style.borderColor = "";

		const btnDownload = document.getElementById("btnDownload");
		if (btnDownload) btnDownload.style.display = "";
		const btnHome = document.getElementById("btnHome");
		if (btnHome) btnHome.style.display = "";
	}

	_openEmailModal() {
		this.emailModal && (this.emailModal.style.display = "flex");
	}

	_closeEmailModal() {
		if (this.emailModal) this.emailModal.style.display = "none";

		const emailError = document.getElementById("emailError");
		const emailInput = document.getElementById("emailInput");
		if (emailError) emailError.style.display = "none";
		if (emailInput) emailInput.style.borderColor = "";
	}

	async _sendEmail() {
		const result = await SharedActions.sendEmail(
			this.selectedFilename,
			this.csrfToken,
		);
		if (!result.success) {
			if (result.error !== "validation") {
				alert("Gagal mengirim email. Silakan coba lagi.");
			}
			if (this.operationQueue && result.error !== "validation") {
				const emailInput = document.getElementById("emailInput");
				await this.operationQueue.enqueue({
					type: "email",
					filename: this.selectedFilename,
					email: emailInput?.value?.trim() || "",
				});
			}
		}
	}

	async _openQRModal() {
		if (!this.selectedFilename) return;

		this.qrModal.style.display = "flex";
		const loading = document.getElementById("qrLoading");
		const image = document.getElementById("qrImage");
		if (loading) loading.style.display = "block";
		if (image) image.style.display = "none";

		const baseUrl = window.location.protocol + "//" + window.location.host;
		const viewUrl = `${baseUrl}/view-photo.php?file=${encodeURIComponent(this.selectedFilename)}`;

		try {
			await SharedActions.generateQR(viewUrl, "qrImage");
		} catch (e) {
			console.error("QR generation failed:", e);
		} finally {
			if (loading) loading.style.display = "none";
			if (image) image.style.display = "block";
		}
	}

	_closeQRModal() {
		this.qrModal && (this.qrModal.style.display = "none");
	}

	async _printPhoto() {
		if (!this.selectedFilename) return;
		const imageUrl = "uploads/photos/" + this.selectedFilename;
		try {
			await SharedActions.printPhoto(imageUrl);
		} catch (e) {
			console.error("[Gallery] Print error:", e);
			alert("Gagal memuat foto untuk cetak. Silakan coba lagi.");
		}
	}

	async _downloadPhoto() {
		if (!this.selectedFilename) return;
		const btn = document.getElementById("btnDownload");
		const originalText = btn?.innerHTML;

		if (btn) {
			btn.disabled = true;
			btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
		}

		try {
			const photoUrl = "uploads/photos/" + this.selectedFilename;
			await BlobDownloader.downloadWithRetry(
				photoUrl,
				"kidversa-photo-" + Date.now() + ".png",
				(progress) => {
					if (btn) {
						btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progress.percent}%`;
					}
				},
				3,
			);

			if (btn) {
				btn.innerHTML = '<i class="fas fa-check"></i> Done';
				setTimeout(() => {
					btn.disabled = false;
					btn.innerHTML = originalText;
				}, 2000);
			}
		} catch (e) {
			console.error("[Gallery] Download error:", e);
			alert("Gagal mengunduh foto. Silakan coba lagi.");
			if (btn) {
				btn.disabled = false;
				btn.innerHTML = originalText;
			}
		}
	}
}
