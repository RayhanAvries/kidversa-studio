export class ImageComposer {
  static fitAndDraw(ctx, img, canvasWidth, canvasHeight, filterStr) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();
    ctx.filter = filterStr || 'none';

    const srcW = img.videoWidth || img.naturalWidth || img.width;
    const srcH = img.videoHeight || img.naturalHeight || img.height;
    const imgRatio = srcW / srcH;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = srcH;
      drawWidth = srcH * canvasRatio;
      offsetX = (srcW - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = srcW;
      drawHeight = srcW / canvasRatio;
      offsetX = 0;
      offsetY = (srcH - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}
