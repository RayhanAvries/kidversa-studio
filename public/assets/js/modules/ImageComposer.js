export class ImageComposer {
  static fitAndDraw(ctx, img, canvasWidth, canvasHeight, filterStr) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();
    ctx.filter = filterStr || 'none';

    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = img.height;
      drawWidth = img.height * canvasRatio;
      offsetX = (img.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = img.width;
      drawHeight = img.width / canvasRatio;
      offsetX = 0;
      offsetY = (img.height - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}
