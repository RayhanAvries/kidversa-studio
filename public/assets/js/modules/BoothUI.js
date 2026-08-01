// removed debug log
export class BoothUI {
	constructor() {
		this.btnCap = document.getElementById("btnCapture");
		this.btnRet = document.getElementById("btnRetake");
		this.btnDone = document.getElementById("btnDone");
		this.btnRetry = document.getElementById("btnRetry");
		this.btnQueue = document.getElementById("btnQueue");
		this.modal = document.getElementById("printModal");
		this.qrModal = document.getElementById("qrModal");
		this.cdOverlay = document.getElementById("cdOverlay");
		this.cdNumber = document.getElementById("cdNumber");
		this.flashFx = document.getElementById("flashFx");
		this.mainArea = document.getElementById("mainArea");
	}

	setCaptureButtonState(disabled) {
		this.btnCap.disabled = disabled;
	}

	startCountdownUI(number) {
		this.cdOverlay.classList.add("on");
		this.cdNumber.textContent = number;
	}

	updateCountdownUI(number) {
		this.cdNumber.textContent = number;
		this.cdNumber.style.animation = "none";
		this.cdNumber.offsetHeight;
		this.cdNumber.style.animation =
			"pop 0.7s cubic-bezier(0.68,-0.55,0.265,1.55)";
	}

	stopCountdownUI() {
		this.cdOverlay.classList.remove("on");
	}

	triggerFlash() {
		this.flashFx.classList.add("on");
		setTimeout(() => this.flashFx.classList.remove("on"), 80);
	}

	showPrintModal() {
		this.modal.classList.add("on");
	}

	showQRModal() {
		this.qrModal.style.display = "flex";
	}

	hideQRModal() {
		this.qrModal.style.display = "none";
	}

	setQRLoading(isLoading) {
		const loading = document.getElementById("qrLoading");
		const image = document.getElementById("qrImage");
		if (!loading || !image) return;
		if (isLoading) {
			loading.style.display = "block";
			image.style.display = "none";
		} else {
			loading.style.display = "none";
			image.style.display = "block";
		}
	}

	setQRImage(src) {
		const image = document.getElementById("qrImage");
		image.src = src;
	}

	showEmailModal() {
		const emailModal = document.getElementById("emailModal");
		if (emailModal) emailModal.style.display = "flex";
	}

	hideEmailModal() {
		const emailModal = document.getElementById("emailModal");
		if (emailModal) emailModal.style.display = "none";
	}

	setCaptureControls(state) {
		if (state === "capture") {
			this.btnCap.style.display = "flex";
			this.btnRet.style.display = "none";
			this.btnDone.style.display = "none";
			if (this.btnRetry) this.btnRetry.style.display = "none";
			if (this.btnQueue) this.btnQueue.style.display = "none";
		} else if (state === "captured") {
			this.btnCap.style.display = "none";
			this.btnRet.style.display = "flex";
			this.btnDone.style.display = "flex";
			if (this.btnRetry) this.btnRetry.style.display = "none";
			if (this.btnQueue) this.btnQueue.style.display = "none";
		} else if (state === "done") {
			this.btnCap.style.display = "none";
			this.btnRet.style.display = "none";
			this.btnDone.style.display = "flex";
			if (this.btnRetry) this.btnRetry.style.display = "none";
			if (this.btnQueue) this.btnQueue.style.display = "none";
		}
	}

	setUploadFailedControls() {
		this.btnCap.style.display = "none";
		this.btnRet.style.display = "flex";
		this.btnDone.style.display = "none";
		if (this.btnRetry) this.btnRetry.style.display = "flex";
		if (this.btnQueue) this.btnQueue.style.display = "flex";
	}

	setRetryInProgressControls() {
		this.btnCap.style.display = "none";
		this.btnRet.style.display = "none";
		this.btnDone.style.display = "none";
		if (this.btnRetry) this.btnRetry.style.display = "none";
		if (this.btnQueue) this.btnQueue.style.display = "none";
	}

	scrollToTop() {
		this.mainArea.scrollTop = 0;
	}

	showLoadingOverlay(message = "Processing...") {
		let overlay = document.getElementById("loadingOverlay");
		if (!overlay) {
			overlay = document.createElement("div");
			overlay.id = "loadingOverlay";
			overlay.style.cssText =
				"position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.6);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99999;color:white;font-family:'Plus Jakarta Sans',sans-serif;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:all 0.3s ease;";
			overlay.innerHTML =
				'<div style="text-align:center;max-width:90%;width:420px;padding:35px;background:rgba(255,255,255,0.08);border-radius:24px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 24px 60px rgba(0,0,0,0.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);"><div class="spinner-container" style="position:relative;width:90px;height:90px;margin:0 auto 25px;"><div style="position:absolute;inset:0;border:4px dashed rgba(255,255,255,0.15);border-radius:50%;"></div><div class="spinner" style="position:absolute;inset:0;border:4px solid transparent;border-top:4px solid #a855f7;border-right:4px solid #eab308;border-radius:50%;animation:spin 1s linear infinite;"></div></div><div class="loading-text" style="font-size:1.4rem;font-weight:700;margin-bottom:15px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.3);">' +
				message +
				'</div><div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;margin-bottom:15px;border:1px solid rgba(255,255,255,0.05);"><div class="progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#a855f7,#eab308);transition:width 0.4s ease;border-radius:10px;"></div></div><div class="loading-subtext" style="font-size:0.9rem;color:rgba(255,255,255,0.75);min-height:22px;font-weight:500;">Harap tunggu sebentar...</div></div><style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>';
			document.body.appendChild(overlay);
		}
		overlay.style.display = "flex";
		this.updateLoadingProgress(0, message);
	}

	updateLoadingProgress(percent, subtext = "") {
		const overlay = document.getElementById("loadingOverlay");
		if (!overlay) return;
		const bar = overlay.querySelector(".progress-bar");
		if (bar) bar.style.width = percent + "%";
		const sub = overlay.querySelector(".loading-subtext");
		if (sub && subtext) sub.textContent = subtext;
	}

	hideLoadingOverlay() {
		const overlay = document.getElementById("loadingOverlay");
		if (overlay) overlay.style.display = "none";
	}

	showToastMessage(message, duration = 3000) {
		let toast = document.getElementById("boothToast");
		if (!toast) {
			toast = document.createElement("div");
			toast.id = "boothToast";
			toast.style.cssText =
				"position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:12px 24px;border-radius:12px;font-size:0.9rem;font-weight:600;z-index:100000;box-shadow:0 8px 24px rgba(0,0,0,0.3);transition:opacity 0.3s ease;font-family:'Plus Jakarta Sans',sans-serif;max-width:90%;text-align:center;";
			document.body.appendChild(toast);
		}
		toast.textContent = message;
		toast.style.opacity = "1";
		clearTimeout(this._toastTimer);
		this._toastTimer = setTimeout(() => {
			toast.style.opacity = "0";
		}, duration);
	}
}
