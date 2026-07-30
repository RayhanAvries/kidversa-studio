import { Config } from './Config.js';
import { ClientQR } from './ClientQR.js';

export class SharedActions {
    static async sendEmail(filename, csrfToken) {
        const emailInput = document.getElementById('emailInput');
        const emailError = document.getElementById('emailError');
        const btnSend = document.getElementById('btnSendEmail');
        const email = emailInput.value.trim();

        const emailRegex = Config.email().regex || /^[a-z0-9._%+-]+@gmail\.com$/i;
        if (!emailRegex.test(email)) {
            emailError.style.display = 'block';
            emailInput.style.borderColor = 'red';
            return { success: false, error: 'validation' };
        }

        emailError.style.display = 'none';
        emailInput.style.borderColor = '';

        const originalBtnText = btnSend.innerHTML;
        btnSend.disabled = true;
        btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const res = await fetch('api/send-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, email, csrf_token: csrfToken })
            });
            const data = await res.json();

            if (data.success) {
                btnSend.innerHTML = '<i class="fas fa-check"></i> Sent!';
                setTimeout(() => {
                    btnSend.innerHTML = originalBtnText;
                    btnSend.disabled = false;
                }, 3000);
                return { success: true };
            } else {
                btnSend.innerHTML = originalBtnText;
                btnSend.disabled = false;
                return { success: false, error: data.message || 'Failed to send email' };
            }
        } catch (err) {
            btnSend.innerHTML = originalBtnText;
            btnSend.disabled = false;
            return { success: false, error: err.message };
        }
    }

    static async printPhoto(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    const html = `<html><head><title>Print</title><style>
                        @page { size: auto; margin: 0; }
                        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        img { max-width: 100%; max-height: 100vh; }
                    </style></head><body><img src="${url}" onload="window.print();window.onafterprint=()=>window.parent.postMessage('printDone','*');"></body></html>`;

                    iframe.contentDocument.write(html);
                    iframe.contentDocument.close();

                    window.addEventListener('message', function onMsg(e) {
                        if (e.data === 'printDone') {
                            window.removeEventListener('message', onMsg);
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(url);
                            resolve();
                        }
                    });
                }, 'image/jpeg', 0.92);
            };
            img.src = imageUrl;
        });
    }

    static async generateQR(viewUrl, imageId) {
        const qrImage = document.getElementById(imageId);
        if (!qrImage) return;

        try {
            const qrDataUrl = await ClientQR.generate(viewUrl, {
                size: Config.qr().size || 300,
                darkColor: '#000000',
                lightColor: '#ffffff'
            });
            qrImage.src = qrDataUrl;
        } catch (e) {
            console.error('[SharedActions] QR generation failed:', e);
        }
    }
}
