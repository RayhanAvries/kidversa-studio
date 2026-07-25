export class ClientQR {
    static generate(text, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const size = options.size || 300;
                const container = document.createElement('div');
                container.style.display = 'none';
                document.body.appendChild(container);

                new QRCode(container, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: options.darkColor || '#000000',
                    colorLight: options.lightColor || '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });

                setTimeout(() => {
                    const canvas = container.querySelector('canvas');
                    if (canvas) {
                        const dataUrl = canvas.toDataURL('image/png');
                        document.body.removeChild(container);
                        resolve(dataUrl);
                    } else {
                        const img = container.querySelector('img');
                        if (img) {
                            document.body.removeChild(container);
                            resolve(img.src);
                        } else {
                            document.body.removeChild(container);
                            reject(new Error('QR generation failed'));
                        }
                    }
                }, 100);
            } catch (e) {
                reject(e);
            }
        });
    }
}
