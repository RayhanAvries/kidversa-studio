import { CameraManager } from "./modules/CameraManager.js";
import { FilterEngine } from "./modules/FilterEngine.js";
import { FrameManager } from "./modules/FrameManager.js";
import { BoothUI } from "./modules/BoothUI.js";
import { Config } from "./modules/Config.js";
import { initPermissions } from "./modules/InitPermissions.js";
import { HandDetection } from "./modules/HandDetection.js";
import { HandDetectionUI } from "./modules/HandDetectionUI.js";
import { MirrorToggleUI } from "./modules/MirrorToggleUI.js";
import { FABWidget } from "./modules/FABWidget.js";
import { ModalManager } from "./modules/ModalManager.js";
import { ChunkUploader } from "./modules/ChunkUploader.js";
import { OperationQueue } from "./modules/OperationQueue.js";

import { ImageComposer } from "./modules/ImageComposer.js";
import { UploadProcessor } from "./modules/UploadProcessor.js";

function makeDraggable(el) {
	let isDown = false;
	let startX,
		startY,
		scrollLeft,
		moved = false;
	const DRAG_THRESHOLD = 15;

	const start = (pageX, pageY) => {
		isDown = true;
		moved = false;
		el.classList.remove("was-dragging");
		startX = pageX - el.offsetLeft;
		startY = pageY;
		scrollLeft = el.scrollLeft;
	};
	const move = (pageX) => {
		if (!isDown) return;
		const x = pageX - el.offsetLeft;
		const walk = x - startX;
		if (Math.abs(walk) > DRAG_THRESHOLD) {
			if (!moved) el.classList.add("dragging");
			moved = true;
		}
		el.scrollLeft = scrollLeft - walk;
	};
	const end = () => {
		if (!isDown) return;
		isDown = false;
		el.classList.remove("dragging");
		if (moved) {
			el.classList.add("was-dragging");
			setTimeout(() => el.classList.remove("was-dragging"), 300);
		}
	};

	el.addEventListener("mousedown", (e) => {
		start(e.pageX, e.pageY);
	});
	window.addEventListener("mousemove", (e) => {
		move(e.pageX);
	});
	window.addEventListener("mouseup", end);
	el.addEventListener("mouseleave", () => {
		if (isDown) end();
	});

	el.addEventListener(
		"touchstart",
		(e) => {
			if (e.touches.length === 1) {
				start(e.touches[0].pageX, e.touches[0].pageY);
			}
		},
		{ passive: false },
	);
	el.addEventListener(
		"touchmove",
		(e) => {
			if (!isDown) return;
			e.preventDefault();
			move(e.touches[0].pageX);
		},
		{ passive: false },
	);
	el.addEventListener("touchend", end);
	el.addEventListener("touchcancel", end);
}

export class Booth {
	constructor() {
		this.cameraConfig = {
			TW: Config.get("photo.width", 1920),
			TH: Config.get("photo.height", 1080),
			FALLBACK_TW: Config.get("photo.fallbackWidth", 1280),
			FALLBACK_TH: Config.get("photo.fallbackHeight", 720),
		};

		this.ui = new BoothUI();
		this.camera = new CameraManager(this.cameraConfig);
		this.frames = new FrameManager();
		this.filters = null;

		this.selFilter = "none";
		this.captured = null;
		this.savedFilename = null;
		this.pendingUpload = null;
		this.uploadKey = null;
		this.currentUploadFilename = null;

		this.handDetect = null;
		this.handDetectUI = null;
		this.modalManager = null;
		this.fabWidget = null;

		this.counting = false;
		this._filterDebounceTimer = null;
		this.csrfToken = null;

		this.chunkUploader = new ChunkUploader();
		this.operationQueue = new OperationQueue();

		this.init();
	}

	async init() {
		try {
			await Config.load();

			const csrfRes = await fetch("api/csrf-token.php");
			if (csrfRes.ok) {
				const csrfData = await csrfRes.json();
				this.csrfToken = csrfData.token;
			}

			await this.operationQueue.init();

			this.uploadProcessor = new UploadProcessor(
				this.operationQueue,
				this.chunkUploader,
				{
					pollInterval: 2000,
					onProgress: (id, progress) => this._onUploadProgress(id, progress),
					onStatusChange: (id, status, result) =>
						this._onUploadStatusChange(id, status, result),
					onError: (id, error, permanent) =>
						this._onUploadError(id, error, permanent),
				},
			);
			this.uploadProcessor.start();

			const filterRes = await fetch("assets/config/filters.json");
			if (!filterRes.ok)
				throw new Error(`Filters fetch failed: ${filterRes.status}`);
			const filterData = await filterRes.json();
			this.filters = new FilterEngine({
				filters: filterData,
				getMirrorState: () => ({
					mirrorH: this.camera.mirrorH,
					mirrorV: this.camera.mirrorV,
				}),
			});

			await this.frames.loadFrameList();

			this.filters.buildFilterUI();
			this.frames.buildFrameUI();
			this.bindEvents();

			if (this.frames.frameFiles.length > 0) {
				this.frames.setFrame(this.frames.frameFiles[0]);
				this.frames.loadFrame();
			}

			window.__appPermissions = await initPermissions();

			this._loadSettings();
			await this.camera.start();

			this.ui.setCaptureButtonState(false);
			const f = this.filters.applyFilter(this.selFilter);
			document.getElementById("filterFx").style.display = f.overlay
				? "block"
				: "none";

			if (this.camera.stream) {
				this.filters.initPreviews(this.camera.stream);
			}

			this._initHandDetection();
			await this._initCameraSelect();
			this._initMirrorToggles();

			this.modalManager = new ModalManager(this);
			this.modalManager.init();

			this.fabWidget = new FABWidget();
			this.fabWidget.init();

			// Cleanup is handled server-side via cron (cron/cleanup-chunks.php)
		} catch (e) {
			console.error("[Booth] FATAL ERROR during init():", e);
			this.ui.btnCap.onclick = () => window.location.reload();
		}
	}

	bindEvents() {
		document.getElementById("filterRow").addEventListener("click", (e) => {
			if (e.currentTarget.classList.contains("was-dragging")) return;
			const c = e.target.closest(".filter-card");
			if (!c) return;
			document
				.querySelectorAll(".filter-card")
				.forEach((el) => el.classList.remove("sel"));
			c.classList.add("sel");
			this.selFilter = c.dataset.filter;
			this.filters.applyFilter(this.selFilter);
			if (this.captured) {
				clearTimeout(this._filterDebounceTimer);
				this._filterDebounceTimer = setTimeout(() => {
					this.handleFilterOrFrameChange();
				}, 300);
			}
		});

		document.getElementById("frameRow").addEventListener("click", (e) => {
			if (e.currentTarget.classList.contains("was-dragging")) return;
			const c = e.target.closest(".frame-card");
			if (!c) return;
			document
				.querySelectorAll(".frame-card")
				.forEach((el) => el.classList.remove("sel"));
			c.classList.add("sel");
			this.frames.setFrame(c.dataset.frame);
			if (this.captured) {
				clearTimeout(this._filterDebounceTimer);
				this._filterDebounceTimer = setTimeout(() => {
					this.handleFilterOrFrameChange();
				}, 300);
			}
		});

		// Draggable horizontal scroll for filter and frame rows
		document.querySelectorAll(".scroll-row").forEach(makeDraggable);

		this.ui.btnCap.addEventListener("click", () => this.startCountdown());
		this.ui.btnRet.addEventListener("click", () => this.retake());
		this.ui.btnDone.addEventListener("click", () => this.finish());

		document.addEventListener(
			"touchmove",
			(e) => {
				if (
					!e.target.closest(".scroll-row") &&
					!e.target.closest(".filter-scroll-container") &&
					!e.target.closest(".controls")
				)
					e.preventDefault();
			},
			{ passive: false },
		);

		document.addEventListener("gesturestart", (e) => e.preventDefault());

		window.addEventListener("resize", () => {
			if (this.camera.ready) this.camera.updateCanvas();
		});

		window.addEventListener("orientationchange", () => {
			setTimeout(() => {
				if (this.camera.ready) this.camera.updateCanvas();
			}, 300);
		});

		window.addEventListener("keydown", (e) => {
			if (
				(e.key === "F5" || (e.ctrlKey && (e.key === "r" || e.key === "R"))) &&
				this.captured
			) {
				e.preventDefault();
				if (this.confirmNavigation()) {
					window.location.reload();
				}
			}
		});

		const btnBack = document.getElementById("btnBack");
		if (btnBack) {
			btnBack.addEventListener("click", (e) => {
				e.preventDefault();
				if (this.confirmNavigation()) {
					window.location.href = "index.php";
				}
			});
		}

		const btnQueue = document.getElementById("btnQueue");
		if (btnQueue) {
			btnQueue.addEventListener("click", () => this._handleGoToQueue());
		}
	}

	confirmNavigation() {
		if (!this.captured) return true;
		const first = confirm(
			"Apakah Anda yakin ingin meninggalkan halaman ini? Foto Anda akan hilang.",
		);
		if (!first) return false;
		const second = confirm(
			"Konfirmasi Kedua: Apakah Anda benar-benar yakin ingin kembali dan menghapus foto Anda?",
		);
		return second;
	}

	async handleFilterOrFrameChange() {
		if (!this.rawData) return;

		// Re-compose image with new filter/frame
		const TW = this.cameraConfig.TW;
		const TH = this.cameraConfig.TH;
		const compositeCanvas = await this.composeFinalImage(this.rawData, TW, TH);
		this.captured = compositeCanvas.toDataURL("image/png");

		// Generate filename
		this.currentUploadFilename = this._generateFilename();

		// Enqueue to queue — don't block UI!
		await this.operationQueue.enqueue({
			type: "save_photo",
			data: {
				filename: this.currentUploadFilename,
				blobBase64: this.captured,
				location: this._getUploadLocation(),
				csrfToken: this.csrfToken,
			},
			maxRetries: 5,
			status: "captured",
		});

		// Toast notification
		this.ui.showToastMessage("Filter/framing diperbarui \u2713", 2000);

		// Update queue counter
		await this._updateQueueCounter();

		// Clear in-memory data (already in IndexedDB)
		this.captured = null;
		this.rawData = null;
		this.currentUploadFilename = null;

		// Return to camera — user can capture again!
		document.getElementById("camVideo").style.display = "block";
		document.getElementById("camCanvas").style.display = "none";
		this.ui.setCaptureControls("capture");
		await this.camera.start();
		this.ui.setCaptureButtonState(false);
		if (this.camera.stream) {
			this.filters.initPreviews(this.camera.stream);
		}

		// Resume hand detection
		this._enableHandDetectionIfActive();
	}

	startCountdown() {
		if (!this.camera.ready || this.counting) return;
		this.counting = true;
		this.ui.setCaptureButtonState(true);
		const timerSelect = document.getElementById("captureTimerSelect");
		let c = timerSelect ? parseInt(timerSelect.value, 10) : 5;
		this.ui.startCountdownUI(c);

		const iv = setInterval(() => {
			c--;
			if (c > 0) {
				this.ui.updateCountdownUI(c);
			} else {
				clearInterval(iv);
				this.ui.stopCountdownUI();
				this.ui.triggerFlash();
				this.capture();
				this.counting = false;
				this.ui.setCaptureButtonState(false);
			}
		}, 1000);
	}

	_generateFilename() {
		const dt = new Date();
		const ts =
			dt.getFullYear().toString() +
			String(dt.getMonth() + 1).padStart(2, "0") +
			String(dt.getDate()).padStart(2, "0") +
			"_" +
			String(dt.getHours()).padStart(2, "0") +
			String(dt.getMinutes()).padStart(2, "0") +
			String(dt.getSeconds()).padStart(2, "0");
		return `kidversa_${ts}.png`;
	}

	_onUploadProgress(id, progress) {
		const percent = Math.round(progress.percent);
		this.ui.updateQueueStatus(id, `Uploading... ${percent}%`);
	}

	_onUploadStatusChange(id, status, result) {
		if (status === "completed") {
			this.ui.showToastMessage("Upload selesai \u2713", 2000);
			this._updateQueueCounter();
		} else if (status === "uploading") {
			this._updateQueueCounter();
		}
	}

	_onUploadError(id, error, permanent) {
		if (permanent) {
			this.ui.showToastMessage("Upload gagal permanen", 3000);
		} else {
			this.ui.showToastMessage("Upload gagal, akan retry...", 2000);
		}
		this._updateQueueCounter();
	}

	async _updateQueueCounter() {
		const count = await this.operationQueue.getTotalPendingCount();
		this.ui.updateQueueCounter(count);
	}

	async capture() {
		if (this.counting) return;

		// Pause hand detection if enabled
		if (this.handDetect && this.handDetect.isEnabled()) {
			this.handDetect.pause();
		}

		// Stop filter previews
		this.filters.stopPreviews();

		// Stop camera
		this.camera.stop();

		// Get raw canvas data
		const rawData = this.camera.getCanvasData();
		this.rawData = rawData;

		// Compose final image
		const TW = this.cameraConfig.TW;
		const TH = this.cameraConfig.TH;
		const compositeCanvas = await this.composeFinalImage(rawData, TW, TH);
		this.captured = compositeCanvas.toDataURL("image/png");

		// Generate filename
		this.currentUploadFilename = this._generateFilename();

		// Enqueue to queue — don't block UI!
		await this.operationQueue.enqueue({
			type: "save_photo",
			data: {
				filename: this.currentUploadFilename,
				blobBase64: this.captured,
				location: this._getUploadLocation(),
				csrfToken: this.csrfToken,
			},
			maxRetries: 5,
			status: "captured",
		});

		// Toast notification
		this.ui.showToastMessage("Foto tersimpan \u2713", 2000);

		// Update queue counter
		await this._updateQueueCounter();

		// Clear in-memory data (already in IndexedDB)
		this.captured = null;
		this.rawData = null;

		// Return to camera — user can capture again!
		document.getElementById("camVideo").style.display = "block";
		document.getElementById("camCanvas").style.display = "none";
		this.ui.setCaptureControls("capture");
		this.ui.scrollToTop();
		await this.camera.start();
		this.ui.setCaptureButtonState(false);
		if (this.camera.stream) {
			this.filters.initPreviews(this.camera.stream);
		}

		// Resume hand detection
		this._enableHandDetectionIfActive();
	}

	async composeFinalImage(imageDataUrl, targetWidth, targetHeight) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = async () => {
				try {
					const canvas = document.createElement("canvas");
					canvas.width = targetWidth || this.camera.cnv.width;
					canvas.height = targetHeight || this.camera.cnv.height;
					const ctx = canvas.getContext("2d");

					const filterObj = this.filters.applyFilter(this.selFilter);
					ImageComposer.fitAndDraw(
						ctx,
						img,
						canvas.width,
						canvas.height,
						filterObj.filter,
					);

					if (filterObj.overlay) {
						ctx.fillStyle = filterObj.overlay;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}

					if (this.frames.selFrame && this.frames.selFrame !== "") {
						const frameLoadResult = await this.loadFrameImage(
							this.frames.selFrame,
						);
						if (frameLoadResult) {
							ctx.drawImage(frameLoadResult, 0, 0, canvas.width, canvas.height);
						}
					}

					resolve(canvas);
				} catch (e) {
					console.error("[Booth] Error composing final image:", e);
					const fallbackCanvas = document.createElement("canvas");
					fallbackCanvas.width = targetWidth || 1920;
					fallbackCanvas.height = targetHeight || 1080;
					const fallbackCtx = fallbackCanvas.getContext("2d");
					fallbackCtx.fillStyle = "#000000";
					fallbackCtx.fillRect(
						0,
						0,
						fallbackCanvas.width,
						fallbackCanvas.height,
					);
					const fallbackImg = new Image();
					fallbackImg.onload = () => {
						fallbackCtx.drawImage(
							fallbackImg,
							0,
							0,
							fallbackCanvas.width,
							fallbackCanvas.height,
						);
						resolve(fallbackCanvas);
					};
					fallbackImg.onerror = () => resolve(fallbackCanvas);
					fallbackImg.src = imageDataUrl;
				}
			};
			img.onerror = () => {
				console.error("[Booth] Failed to load image data for composition");
				const errorCanvas = document.createElement("canvas");
				errorCanvas.width = targetWidth || 1920;
				errorCanvas.height = targetHeight || 1080;
				const errorCtx = errorCanvas.getContext("2d");
				errorCtx.fillStyle = "#000000";
				errorCtx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
				resolve(errorCanvas);
			};
			img.src = imageDataUrl;
		});
	}

	async loadFrameImage(frameName) {
		return new Promise((resolve) => {
			const framePath = this.frames.getFramePath();
			const frameImg = new Image();
			frameImg.crossOrigin = "anonymous";
			frameImg.onload = () => resolve(frameImg);
			frameImg.onerror = () => {
				console.warn("[Booth] Failed to load frame:", frameName);
				resolve(null);
			};
			frameImg.src = `${framePath}/${frameName}.png`;
		});
	}

	_getUploadLocation() {
		return window.__appPermissions?.position
			? {
					lat: window.__appPermissions.position.coords.latitude,
					lng: window.__appPermissions.position.coords.longitude,
					name:
						window.__appPermissions.position.name ||
						Config.get("geolocation.defaultName", "Kidversa Studio, Bandung"),
				}
			: {
					lat: Config.get("geolocation.defaultLat", -6.9175),
					lng: Config.get("geolocation.defaultLng", 107.6191),
					name: Config.get("geolocation.defaultName", "Bandung"),
				};
	}

	getPhotoStatus() {
		if (this.pendingUpload && this.pendingUpload.key === this.uploadKey) {
			return { status: "pending", key: this.uploadKey };
		}
		if (this.savedFilename) {
			return { status: "saved", filename: this.savedFilename };
		}
		return { status: "none" };
	}

	async retake() {
		// Cancel any in-flight upload
		if (this.uploadProcessor) {
			this.uploadProcessor.cancelCurrent();
		}

		if (this.captured && !this.savedFilename && this.currentUploadFilename) {
			await this.operationQueue.enqueue({
				type: "save_photo",
				data: {
					filename: this.currentUploadFilename,
					blobBase64: this.captured,
					location: this._getUploadLocation(),
					csrfToken: this.csrfToken,
				},
				maxRetries: 5,
				status: "captured",
			});
			this.ui.showToastMessage(
				"Foto masuk antrian. Akan dicoba otomatis.",
				3000,
			);
		}
		this.currentUploadFilename = null;
		this.rawData = null;
		this.captured = null;
		this.savedFilename = null;
		this.pendingUpload = null;
		this.uploadKey = null;
		this.ui.setCaptureControls("capture");
		this.ui.setCaptureButtonState(true);
		document.getElementById("camVideo").style.display = "block";
		document.getElementById("camCanvas").style.display = "none";
		this.camera.ctx.clearRect(
			0,
			0,
			this.camera.cnv.width,
			this.camera.cnv.height,
		);
		document.getElementById("camCanvas").style.filter = "none";
		this.frames.loadFrame();
		const f = this.filters.applyFilter(this.selFilter);
		document.getElementById("filterFx").style.display = f.overlay
			? "block"
			: "none";
		await this.camera.start();
		this.ui.setCaptureButtonState(false);
		if (this.camera.stream) {
			this.filters.initPreviews(this.camera.stream);
		}

		this._enableHandDetectionIfActive();
	}

	async finish() {
		try {
			if (!this.savedFilename) {
				return;
			}
			this.ui.showPrintModal();
		} catch (e) {
			console.error("[Booth] Finish error:", e);
			this.ui.showToastMessage("Error: " + e.message);
		}
	}

	async _handleGoToQueue() {
		if (this.currentUploadFilename && this.captured) {
			await this.operationQueue.enqueue({
				type: "save_photo",
				data: {
					filename: this.currentUploadFilename,
					blobBase64: this.captured,
					location: this._getUploadLocation(),
					csrfToken: this.csrfToken,
				},
				maxRetries: 5,
				status: "captured",
			});
		}
		window.location.href = "queue.php?autoretry=1";
	}

	_loadSettings() {
		try {
			const savedDevice = localStorage.getItem("kidversa_camera_device");
			const savedMirrorH = localStorage.getItem("kidversa_mirror_h");
			const savedMirrorV = localStorage.getItem("kidversa_mirror_v");
			if (savedDevice) this.camera.currentDeviceId = savedDevice;
			if (savedMirrorH === "true") this.camera.mirrorH = true;
			if (savedMirrorV === "true") this.camera.mirrorV = true;
		} catch (e) {
			console.warn("[Booth] Failed to load settings from localStorage", e);
		}
	}

	_saveSettings() {
		try {
			if (this.camera.currentDeviceId) {
				localStorage.setItem(
					"kidversa_camera_device",
					this.camera.currentDeviceId,
				);
			} else {
				localStorage.removeItem("kidversa_camera_device");
			}
			localStorage.setItem("kidversa_mirror_h", String(this.camera.mirrorH));
			localStorage.setItem("kidversa_mirror_v", String(this.camera.mirrorV));
		} catch (e) {
			console.warn("[Booth] Failed to save settings to localStorage", e);
		}
	}

	destroy() {
		if (this.uploadProcessor) {
			this.uploadProcessor.stop();
		}

		if (this.handDetect) {
			this.handDetect.destroy();
			this.handDetect = null;
		}
		if (this.handDetectUI) {
			this.handDetectUI.destroy();
			this.handDetectUI = null;
		}
		if (this.mirrorHToggle) {
			this.mirrorHToggle.destroy();
			this.mirrorHToggle = null;
		}
		if (this.mirrorVToggle) {
			this.mirrorVToggle.destroy();
			this.mirrorVToggle = null;
		}
		if (this.fabWidget) {
			this.fabWidget.destroy();
			this.fabWidget = null;
		}
		this.filters.stopPreviews();
		this.camera.stop();
	}

	_initHandDetection() {
		const badgeWrap = document.getElementById("handDetectBadgeWrap");
		if (!badgeWrap) return;

		const photoBox = document.getElementById("photoBox");

		this.handDetectUI = new HandDetectionUI(badgeWrap, {
			onToggle: (active) => this._handleHandDetectToggle(active),
		});

		this.handDetect = new HandDetection({
			palmHoldTime: 1200,
			cooldownTime: 3500,
			onDetect: () => this._handleHandDetected(),
			onStatusChange: (status) => {
				if (status === "loading") {
					this.handDetectUI.setReady(false);
				} else if (status === "ready") {
					this.handDetectUI.setReady(true);
				}
			},
			onHandStateChange: (detected) => {
				this.handDetectUI.setHandDetected(detected);
				if (photoBox) {
					if (detected) {
						photoBox.classList.add("hand-detected");
					} else {
						photoBox.classList.remove("hand-detected");
					}
				}
			},
		});

		this.handDetect.init(document.getElementById("camVideo")).then((ok) => {
			this.handDetectUI.setReady(ok);
		});
	}

	_handleHandDetectToggle(active) {
		if (!this.handDetect) return;
		const photoBox = document.getElementById("photoBox");
		if (active) {
			if (!this.handDetect._modelLoaded) {
				this.handDetectUI.setLoading(true);
			}
			this.handDetect.start();
		} else {
			this.handDetect.enabled = false;
			this.handDetect.stop();
			if (photoBox) photoBox.classList.remove("hand-detected");
		}
	}

	_handleHandDetected() {
		if (!this.camera.ready || this.counting || this.captured) return;
		this.startCountdown();
	}

	_enableHandDetectionIfActive() {
		if (this.handDetect && this.handDetect.isEnabled()) {
			this.handDetect.start();
		}
	}

	async _initCameraSelect() {
		const select = document.getElementById("cameraSelect");
		if (!select) return;

		if (this.camera.stream) {
			await this.camera.getDevices();
		}

		if (this.camera.devices.length > 0) {
			select.innerHTML = "";
			this.camera.devices.forEach((device, i) => {
				const option = document.createElement("option");
				option.value = device.deviceId;
				option.textContent = device.label || `Camera ${i + 1}`;
				if (device.deviceId === this.camera.currentDeviceId) {
					option.selected = true;
				}
				select.appendChild(option);
			});
		}

		select.addEventListener("change", async () => {
			const deviceId = select.value;
			if (!deviceId) {
				this.camera.currentDeviceId = null;
				await this.camera.start();
			} else {
				await this.camera.startWithDevice(deviceId);
			}
			this._saveSettings();
			this.ui.setCaptureButtonState(false);
			if (this.camera.stream) {
				this.filters.stopPreviews();
				this.filters.initPreviews(this.camera.stream);
			}
		});
	}

	_initMirrorToggles() {
		const mirrorHWrap = document.getElementById("mirrorHBadgeWrap");
		const mirrorVWrap = document.getElementById("mirrorVBadgeWrap");

		if (mirrorHWrap) {
			this.mirrorHToggle = new MirrorToggleUI(mirrorHWrap, {
				icon: "fas fa-arrows-alt-h",
				label: "Mirror H",
				onToggle: (active) => {
					this.camera.setMirrorH(active);
					this._saveSettings();
				},
			});
			if (this.camera.mirrorH) this.mirrorHToggle.setActive(true);
		}

		if (mirrorVWrap) {
			this.mirrorVToggle = new MirrorToggleUI(mirrorVWrap, {
				icon: "fas fa-arrows-alt-v",
				label: "Mirror V",
				onToggle: (active) => {
					this.camera.setMirrorV(active);
					this._saveSettings();
				},
			});
			if (this.camera.mirrorV) this.mirrorVToggle.setActive(true);
		}
	}
}

window.booth = new Booth();

window.addEventListener("beforeunload", (e) => {
	if (window.booth && window.booth.captured) {
		e.preventDefault();
		e.returnValue = "";
		return "";
	}
	if (window.booth) window.booth.destroy();
});

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		if (window.booth) {
			window.booth.filters.stopPreviews();
		}
	} else {
		if (window.booth && !window.booth.captured && window.booth.camera.ready) {
			window.booth.camera.startDraw();
			window.booth.filters.initPreviews(window.booth.camera.stream);
		}
	}
});
