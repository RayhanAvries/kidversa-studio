export class ClientQR {
	/**
	 * Generate QR code data URL with optional circular logo watermark.
	 *
	 * @param {string} text - QR content
	 * @param {object} options
	 * @param {number}  [options.size=300]       - QR canvas dimensions (px)
	 * @param {string}  [options.darkColor='#000000']
	 * @param {string}  [options.lightColor='#ffffff']
	 * @param {string}  [options.logoUrl]        - URL of logo to embed (circular crop)
	 * @param {number}  [options.logoWidth=60]   - Logo diameter inside the QR
	 * @returns {Promise<string>} data URL
	 */
	static generate(text, options = {}) {
		return new Promise((resolve, reject) => {
			try {
				const size = options.size || 300;
				const container = document.createElement("div");
				container.style.display = "none";
				document.body.appendChild(container);

				new QRCode(container, {
					text: text,
					width: size,
					height: size,
					colorDark: options.darkColor || "#000000",
					colorLight: options.lightColor || "#ffffff",
					correctLevel: QRCode.CorrectLevel.H,
				});

				setTimeout(() => {
					const qrCanvas = container.querySelector("canvas");
					document.body.removeChild(container);

					if (!qrCanvas) {
						const img = container.querySelector("img");
						if (img) {
							resolve(img.src);
						} else {
							reject(new Error("QR generation failed"));
						}
						return;
					}

					if (options.logoUrl) {
						ClientQR._overlayCircularLogo(
							qrCanvas,
							options.logoUrl,
							options.logoWidth || 60,
						)
							.then(resolve)
							.catch(reject);
					} else {
						resolve(qrCanvas.toDataURL("image/png"));
					}
				}, 100);
			} catch (e) {
				reject(e);
			}
		});
	}

	/**
	 * Overlay a circular-cropped logo onto the QR canvas center.
	 * Draws a white circle background first, then the logo clipped to a circle.
	 */
	static _overlayCircularLogo(qrCanvas, logoUrl, logoWidth) {
		return new Promise((resolve, reject) => {
			const logo = new Image();
			logo.crossOrigin = "anonymous";

			const timeout = setTimeout(() => {
				// Fallback: return QR without logo if image times out
				resolve(qrCanvas.toDataURL("image/png"));
			}, 5000);

			logo.onerror = () => {
				clearTimeout(timeout);
				// Fallback: return QR without logo on load error
				resolve(qrCanvas.toDataURL("image/png"));
			};

			logo.onload = () => {
				clearTimeout(timeout);

				const canvas = document.createElement("canvas");
				canvas.width = qrCanvas.width;
				canvas.height = qrCanvas.height;
				const ctx = canvas.getContext("2d");

				// Draw QR code
				ctx.drawImage(qrCanvas, 0, 0);

				const cx = canvas.width / 2;
				const cy = canvas.height / 2;
				const radius = logoWidth / 2;
				const padding = Math.max(4, Math.round(radius * 0.2));

				// White circle background (slightly larger than logo)
				ctx.beginPath();
				ctx.arc(cx, cy, radius + padding, 0, Math.PI * 2);
				ctx.fillStyle = "#ffffff";
				ctx.fill();

				// Circular clip + draw logo
				ctx.save();
				ctx.beginPath();
				ctx.arc(cx, cy, radius, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();

				// Cover-fit the logo inside the circle
				const logoAspect = logo.naturalWidth / logo.naturalHeight;
				let drawW, drawH;
				if (logoAspect > 1) {
					drawH = logoWidth;
					drawW = logoWidth * logoAspect;
				} else {
					drawW = logoWidth;
					drawH = logoWidth / logoAspect;
				}
				ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
				ctx.restore();

				resolve(canvas.toDataURL("image/png"));
			};

			logo.src = logoUrl;
		});
	}
}
