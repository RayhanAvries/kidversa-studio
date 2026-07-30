# Task 11: Extract shared email, print, QR utilities (H4, H5, H6)

**Status:** Complete

## Changes Made

### 1. Created `public/assets/js/modules/SharedActions.js`
New utility class with three static methods extracted from ModalManager and GalleryPage:
- `sendEmail(filename, csrfToken)` — validates email against `Config.email().regex`, sends POST to `api/send-email.php`
- `printPhoto(imageUrl)` — creates hidden iframe with image, calls `window.print()`, resolves after print completes
- `generateQR(viewUrl, containerId)` — generates QR in specified container element using `ClientQR`

Imports: `Config`, `ClientQR`

### 2. Modified `public/assets/js/modules/ModalManager.js`
- Added import: `import { SharedActions } from './SharedActions.js';`
- `sendEmail()` — replaced body with `return SharedActions.sendEmail(this.booth.savedFilename, this.booth.csrfToken);`
- `printNow()` — kept status check, replaced print logic body with `await SharedActions.printPhoto('uploads/photos/' + statusCheck.filename);`
- `openQRModal()` — replaced `ClientQR.generate()` + `qrImage.src` logic with `SharedActions.generateQR(viewUrl, 'qrImage');` and cleared loading state

### 3. Modified `public/assets/js/modules/GalleryPage.js`
- Added import: `import { SharedActions } from './SharedActions.js';`
- `_sendEmail()` — replaced body with try/catch: calls `SharedActions.sendEmail(this.selectedFilename, this.csrfToken)`; on failure, enqueues to `this.operationQueue` (H15)
- `_printPhoto()` — replaced body with `await SharedActions.printPhoto('uploads/photos/' + this.selectedFilename);`
- `_openQRModal()` — replaced `ClientQR.generate()` promise chain with `SharedActions.generateQR(viewUrl, 'galleryQrImage');`

## Verification

- All three files are syntactically valid JavaScript (ES module format)
- SharedActions methods are pure delegations — no new dependencies introduced
- ModalManager and GalleryPage now delegate common operations to SharedActions
- OperationQueue integration (H15) added to GalleryPage._sendEmail catch block
