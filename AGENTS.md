# AGENTS.md

## What This Is

Kidversa Studio — a PHP photo booth web app (camera capture, filters, frames, email, QR download, chunked upload, queue management, gallery, PWA). No framework, PSR-4 autoloading, Apache + Docker. Active branch: `v4.4`.

## Tech Stack

| Layer | Technology | Version |
| ------- | ----------- | --------- |
| Language | PHP | >= 8.1 (8.4 in Docker) |
| Frontend | Vanilla JS (ES modules) | ES2020 |
| Email | PHPMailer | ^6.10 |
| QR | endroid/qr-code | ^6.1 |
| CSS | Vanilla CSS (no preprocessor) | - |
| Server (Dev) | Apache with mod_rewrite | Docker |
| Server (Prod) | Nginx + PHP-FPM | VPS |
| Container | Docker (php:8.4-apache) | - |
| CI | GitHub Actions | - |
| Code Style | PHP-CS-Fixer (PER-CS / PSR-12) | ^3.0 |

## Running Locally

### Laragon (recommended)

- Set document root to `public/`
- PHP >= 8.1 required
- Copy `.env.example` → `.env`, fill in SMTP values and `STUDIO_EMAIL`
- App at <http://localhost>

### Docker (opsional)

```bash
docker-compose up -d
# App at http://localhost
```

> **⚠️ Catatan:** Jangan jalankan Docker dan Laragon bersamaan — keduanya menggunakan port 80. Matikan salah satu sebelum menjalankan yang lain.

Production uses `docker-compose.prod.yml` (named volume for uploads, env_file, restart: always).

### Composer

```bash
composer install          # first time
composer dump-autoload    # if vendor/ is corrupted
```

**Windows gotcha:** If `composer dump-autoload` fails with "Permission denied" on `vendor/composer/`, delete `vendor/` entirely and re-run `composer install`. This happens when Docker creates files as root then Windows can't overwrite them.

## Project Structure

```
src/                     # PHP backend (PSR-4: Kidversa\, 19 files, all declare(strict_types=1))
  bootstrap.php          # Autoloader, .env parser, session, timezone, error reporting, upload dir creation
  Config/                # 6 files: AppConfig (constants-only facade over domain configs)
    AppConfig.php        #   Backward-compatible facade — delegates to domain configs below
    StudioConfig.php     #   Studio identity: name, location, phone, email, Indonesian month/day names
    PhotoConfig.php      #   Photo settings: upload path, frames dir, dimensions, expiry, timestamps
    EmailConfig.php      #   Email: Gmail-only regex, subject, attachment name, alt body
    UiConfig.php         #   UI: colors (indigo/cyan/red/dark), QR size/margin, geolocation timeout
    EnvValidator.php     #   Validates .env required vars, BASE_URL format, SMTP_PORT range
  Controllers/
    PhotoController.php  # Single method: prepareViewData() — validates filename, delegates to PhotoService
  Helpers/               # 8 files
    ValidationHelper.php #   Filename regex, Gmail-only email, uploaded file (10MB, MIME via finfo), sanitize
    CsrfHelper.php       #   32-byte random hex tokens, hash_equals() comparison, session-backed
    PathHelper.php       #   realpath() + prefix-check path traversal prevention via basename()
    RateLimitHelper.php  #   File-based sliding window with flock() for concurrency
    SecurityHelper.php   #   Security headers (XFO, CSP, HSTS, Referrer-Policy, Permissions-Policy)
    EnvHelper.php        #   Hand-rolled .env parser (NOT vlucas/phpdotenv) — simple line-by-line key=value
    FileHelper.php       #   Thin facade: getUploadDir(), getFrameList()
    ChunkAssemblyHelper.php  # Largest helper (195 lines): chunk init/add/assemble/progress/cleanup with flock()
  Services/
    PhotoService.php     #   File info formatting, expiry check, filename validation/generation, JSON metadata
    EmailService.php     #   PHPMailer SMTP (STARTTLS), Gmail-only, HTML template with embedded images
    FrameService.php     #   Scans frames/ dir for .png files, fallback to ['kidversa', 'koran']

public/                  # Web root (Apache DocumentRoot)
  api/                   # 16 standalone PHP endpoints (NOT routed — direct HTTP access)
    config.php           #   GET, returns full app config as JSON (300s cache, EnvValidator)
    csrf-token.php       #   GET, generates and returns CSRF token
    save-photo.php       #   POST multipart, 10 req/min, CSRF, file validation, JSON metadata
    delete-photo.php     #   POST, CSRF, path-safe deletion + JSON metadata cleanup
    rename-photo.php     #   POST JSON, CSRF, renames photo + metadata, path-safe
    send-email.php       #   POST JSON, 5 req/min, CSRF, Gmail-only, PHPMailer
    download-photo.php   #   GET, stream file with readfile(), path-safe
    check-photo.php      #   GET, file existence check
    list-photos.php      #   GET, 30 req/min, paginated (25/page, max 100), 30s cache, filters expired
    check-queue.php      #   POST JSON, 20 req/min, CSRF, batch checks up to 50 filenames
    chunk-init.php       #   POST JSON, 10 req/min, CSRF, max 100 chunks, max 50MB
    chunk-upload.php     #   POST multipart, 50 req/min, CSRF, per-chunk with file locking
    chunk-complete.php   #   POST JSON, 10 req/min, CSRF, assembles chunks, cleanup on success
    cleanup-photos.php   #   GET, 5 req/min, CSRF in query param, deletes expired + stale chunks
    frames.php           #   GET, lists frame PNGs (300s cache)
    generate-qr.php      #   GET, 20 req/min, endroid/qr-code with logo embed
    .htaccess            #   RewriteEngine Off — bypasses any future router
  assets/
    js/
      booth.js           # Main app orchestrator (~917 lines), ES module entry point
      modules/
        BoothUI.js         # UI state machine: capture/retake/done/retry controls, countdown, flash, modals
        CameraManager.js   # WebRTC getUserMedia with resolution fallback chain, device enumeration, mirror state
        FilterEngine.js    # 21 CSS filters with 15fps thumbnail preview loop (canvas-based)
        FrameManager.js    # Overlay frame rendering, frame list fetch from api/frames.php
        Config.js          # Singleton config fetcher (api/config.php), dot-notation get(), domain accessors
        Lang.js            # i18n plain object — Indonesian (primary) + English, template replacements
        ModalManager.js    # Print/Email/QR modals orchestration, uses SharedActions + BlobDownloader
        InitPermissions.js # Camera & notification permission request flow
        HandDetection.js   # MediaPipe Hands: open-palm detection with 1.2s hold + 3s cooldown
        HandDetectionUI.js # Hand pose toggle badge with indicator dot + status text
        MirrorToggleUI.js  # Mirror toggle badges (horizontal/vertical) for camera preview
        ChunkUploader.js   # Client-side chunked upload (512KB chunks, exponential backoff retry)
        OperationQueue.js  # IndexedDB-backed upload queue ('KidversaQueue', v2 schema)
        QueuePage.js       # Queue management page module (standalone, NOT loaded by booth.js)
        UploadProcessor.js  # 2-second background poll interval for retrying pending queue items
        RateLimitError.js     # Custom error class for HTTP 429 responses (status, retryAfter, endpoint)
        GalleryPage.js     # Gallery page module (standalone), pagination, rename/delete/modals
        ClientQR.js        # Client-side QR via global QRCode library (qrcode.js CDN)
        BlobDownloader.js  # XHR blob download with progress + exponential backoff retry
        ImageComposer.js   # Canvas cover-fit drawing utility (used by CameraManager + Booth)
        SharedActions.js   # Shared email/print/QR actions used by both ModalManager + GalleryPage
    css/
      main.css            # Landing page (index.php): animated blobs, logo rings, CTA (542 lines)
      capture.css         # Main app stylesheet (~1786 lines): header, camera, modals, gallery, queue
      view-photo.css      # Photo detail page: cards, info grid, action buttons (304 lines)
    config/filters.json   # 21 filter definitions (CSS filter + overlay color)
    img/                  # logo.png, frames/ directory
  partials/
    app-header.php        # Shared navigation bar (active page via $activePage, conditional nav via $showNav)
    footer.php            # Just closes </body></html>
    modals/               # email-modal.php, print-modal.php, qr-modal.php (always in DOM, hidden via CSS)
    view-photo/           # header.php, photo-card.php, contact.php, thank-you.php, error.php
  uploads/
    .htaccess             # Denies PHP execution (php_flag engine off + FilesMatch block)
    photos/               # Uploaded photos + .json metadata files (gitignored, auto-created)
  version.json           # Single source of truth for app version (read by SW + AppConfig)
  sw.js                  # Service worker: dynamic version from version.json, network-first CSS/JS
  Page templates (directly in public/, NOT routed):
    index.php             # Landing page with animated SVG logo and "Start" CTA, SW registration
    take-photo.php        # Camera booth: loads booth.js ES module, dynamic SW version, CDN scripts
    view-photo.php        # Photo detail: PhotoController::prepareViewData(), renders card/error, SW registration
    gallery.php           # Gallery with pagination: loads GalleryPage.js module, dynamic SW version
    queue.php             # Queue management: loads QueuePage.js module, dynamic SW version
    favicon.png           # Favicon

cron/
  cleanup-chunks.php      # CLI script: removes stale chunks + expired photos (suggested: hourly via cron)

storage/                  # Runtime data (gitignored)
  ratelimit/              # File-based rate limit tracking (JSON files with flock())
  chunks/                 # Temporary chunk storage (.htaccess security, auto-cleaned by cron)

plans/                    # Design & refactoring plans (gitignored)
DEPLOY.md                 # Deployment checklist (cache invalidation workflow)
nginx-cache.conf          # Reference Nginx config for production cache headers (copy to VPS)

docs/
  superpowers/plans/      # Design docs
```

## Key Architecture Decisions

- **No framework.** Custom bootstrap, standalone API files, manual routing. All classes use **static methods** — no dependency injection, no constructor injection.
- **Router/Middleware deleted.** `src/Router.php`, `src/Middleware/`, and `src/Helpers/ResponseHelper.php` were removed in commit `3d0acfe` (~950 lines of dead code). Do not reference them.
- **All API responses standardized.** Every endpoint now returns `{"success": true/false, ...}` — standardized in commit `9cb6acc`. Errors return HTTP 4xx/5xx + JSON `{success: false, message}`.
- **CSRF on POST endpoints.** Frontend fetches token from `api/csrf-token.php`, includes in body (`csrf_token`). Cleanup-photos uses CSRF token as GET param (unusual — intentional).
- **File-based rate limiting.** Stored in `storage/ratelimit/` with JSON files and `flock()` for concurrency safety. 9 endpoints rate-limited with per-endpoint limits.
- **Chunked upload.** Blobs split into 512KB chunks client-side by `ChunkUploader.js`, sent to `chunk-init` → `chunk-upload` (×N) → `chunk-complete`, reassembled by `ChunkAssemblyHelper` with atomic `.tmp.{pid}` writes in `storage/chunks/`.
- **Operation queue.** `OperationQueue.js` persists upload tasks in IndexedDB (`KidversaQueue`, v3) with status tracking, progress, atomic claim mechanism (`claimNextItem`), and retry support. `QueuePage.retryItem()` handles UI-level retry with re-entrancy guard (`_retryingIds` Set), offline detection, and friendly error mapping. Network errors do NOT increment retry counter. Manual retry resets counter to 0.
- **PWA.** `sw.js` fetches `version.json` at install for dynamic cache name (`kidversa-v${version}`). CSS/JS: network-first (always fresh). Images: cache-first (performance). API: network-only, 503 offline fallback. Static assets cached on-demand (no hardcoded list). Deploy: bump `version.json` only.
- **Gallery and Queue are standalone pages.** `gallery.php` and `queue.php` load their own page-level JS modules (`GalleryPage.js`, `QueuePage.js`) — NOT through `booth.js`. `GalleryPage` has its own modal logic (does not use `ModalManager`).
- **All API files include `src/bootstrap.php`** — loads autoloader, parses `.env`, starts session, sets timezone.
- **Config split.** `AppConfig` is a backward-compatible facade over `StudioConfig`, `PhotoConfig`, `EmailConfig`, `UiConfig`. New code should use domain-specific config classes.
- **`booth.js` is the central orchestrator** — creates all subsystem instances, wires callbacks, manages state machine. Uses ES modules (`import`/`export`), loaded as `<script type="module">`.
- **`MirrorToggleUI.js`** provides horizontal/vertical mirror toggle badges. Created by `booth.js`, reads/writes mirror state from `CameraManager.mirrorH`/`mirrorV`.
- **`window.booth`** is the global Booth instance. Only referenced inside `booth.js` itself (8 occurrences). Avoid relying on it from external code.
- **`SharedActions.js`** is shared between `ModalManager` and `GalleryPage` for email/print/QR operations — they pass different target image IDs.
- **`EnvHelper` is a hand-rolled `.env` parser** — NOT `vlucas/phpdotenv`. Simple line-by-line `KEY=VALUE` parser. No support for multi-line values or variable interpolation.

## .env Required Variables

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, BASE_URL, STUDIO_EMAIL
```

Optional: `APP_DEBUG` (true for dev), `APP_TIMEZONE` (defaults to `Asia/Jakarta`), `APP_ENV` (defaults to `production`).
See `.env.example` (dev) and `.env.production.example` (production deployment reference).

## API Endpoints Reference

| Endpoint | Method | Rate Limit | CSRF | Input Format | Response Type |
| ---------- | -------- | ----------- | ------ | ------------- | --------------- |
| `config.php` | GET | - | - | - | JSON |
| `csrf-token.php` | GET | - | - | - | JSON |
| `check-photo.php` | GET | - | - | Query | JSON |
| `download-photo.php` | GET | - | - | Query | Image binary |
| `frames.php` | GET | - | - | - | JSON |
| `generate-qr.php` | GET | 40/min | - | Query | PNG image |
| `list-photos.php` | GET | 60/min | - | Query | JSON (paginated) |
| `cleanup-photos.php` | GET | 10/min | ✓ (query) | Query | JSON |
| `save-photo.php` | POST | 30/min | ✓ | Multipart | JSON |
| `delete-photo.php` | POST | - | ✓ | Form | JSON |
| `rename-photo.php` | POST | - | ✓ | JSON | JSON |
| `send-email.php` | POST | 15/min | ✓ | JSON | JSON |
| `check-queue.php` | POST | 60/min | ✓ | JSON | JSON |
| `chunk-init.php` | POST | 30/min | ✓ | JSON | JSON |
| `chunk-upload.php` | POST | 150/min | ✓ | Multipart | JSON |
| `chunk-complete.php` | POST | 30/min | ✓ | JSON | JSON |

Endpoints without rate limiting: config, csrf-token, check-photo, delete-photo, download-photo, frames, rename-photo.
Endpoints without CSRF: config, csrf-token, check-photo, download-photo, frames, generate-qr, list-photos.

## Code Style

- PHP: 4 spaces, PSR-12 / PER-CS1.0 (enforced by `.php-cs-fixer.dist.php`)
- JS: 2 spaces
- CSS: 2 spaces
- JSON: 2 spaces
- Dockerfile / docker-compose: 2 spaces
- Enforced by `.editorconfig`
- PHP-CS-Fixer scans `src/` and `public/api/`
- All PHP classes use `declare(strict_types=1)`

### Formatting Commands

```bash
composer cs              # auto-fix PHP formatting
composer cs:check        # dry-run check (CI uses this)
```

## CI (GitHub Actions)

On push/PR to `main` / `v4.1`:

1. PHP syntax check (`php -l` on all `.php` files in `src/` and `public/`)
2. `composer validate --strict`
3. Docker build + health check

## Git Conventions

- **Branching:** Version branches (`v2.0` through `v4.3`), `main` is stable. Remote also has `v3.0`-`v3.6`.
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `perf:` prefixes. Some include ticket references like `(H11)`, `(M15)`, `(C7)`.
- **PR workflow:** Merge commits (no squash/rebase enforced).
- **Contributor:** Primarily `mochizzan` (121 commits) plus occasional external contributions.

## Request Lifecycle

1. **Page load**: Browser hits `take-photo.php` (or `gallery.php`, `queue.php`) → PHP includes `partials/app-header.php` + renders HTML → inline script checks SW version (`localStorage` vs `SW_VERSION`) → registers service worker → browser loads ES module (`booth.js`, `GalleryPage.js`, or `QueuePage.js`).
2. **App init** (`booth.js`): `Booth.init()` loads Config from `api/config.php` → fetches CSRF token → opens `OperationQueue` IndexedDB → loads filters JSON → fetches frame list → builds UI → requests camera via `CameraManager.start()` → starts 15fps filter preview loop → initializes hand detection → sets up `ModalManager` → starts UploadProcessor background processor (2s poll interval).
3. **Photo capture**: User selects filter/frame/timer → `startCountdown()` counts down → `triggerFlash()` → `capture()` pauses hand detection, stops preview, renders canvas via `ImageComposer.fitAndDraw()`, applies CSS filter + frame overlay PNG → transitions to "captured" UI state.
4. **Upload**: `savePhotoToBackend()` converts dataURL to Blob → `ChunkUploader.upload()` splits into 512KB chunks → POST to `api/chunk-init.php` → POST ×N to `api/chunk-upload.php` → POST to `api/chunk-complete.php` → assembled file in `public/uploads/photos/` → optional `.json` metadata file.
5. **Queue fallback**: If upload fails, `OperationQueue.enqueue('save_photo')` → user manages at `queue.php`. Retry button disabled when maxRetries reached (shows "Batas percobaan tercapai"). Stale "uploading" claims auto-reset after 30s via `resetStaleClaims()`.
6. **View photo**: Redirect to `view-photo.php?file=xxx.png` → `PhotoController::prepareViewData()` → `PhotoService::formatFileInfo()` reads metadata → renders action card with download/email/QR/share options.
7. **Cleanup**: `api/cleanup-photos.php` (GET, CSRF in query) or `cron/cleanup-chunks.php` (CLI) → `PhotoService::deleteExpiredPhotos()` removes files older than `PHOTO_EXPIRY_TIME` (3600s) + `ChunkAssemblyHelper::cleanupStale()`.

## Cross-Cutting Patterns

### Architecture

- **All classes are static** — no dependency injection, no constructor injection, no interfaces
- **File-based persistence** — rate limiting (JSON + flock), chunk uploads (disk-based), config cache (temp files)
- **Config facade pattern** — `AppConfig` delegates 33+ constants to 4 domain-specific config classes
- **No ORM** — no database at all. Photos stored as files, metadata as sidecar `.json` files
- **No test suite** — manual testing only

### API Patterns

- **Error response**: Always `{"success": false, "message": "..."}`, some add `exists`, `errors`, `hasFiles`
- **READ endpoints cache** — config (300s), frames (300s), list-photos (30s) — all file-based in `sys_get_temp_dir()`
- **CSRF in body** — POST endpoints accept CSRF in `$_POST['csrf_token']` or JSON body `csrf_token`
- **JSON body endpoints**: rename, send-email, check-queue, chunk-init, chunk-complete
- **Form-data endpoints**: save-photo, delete-photo, chunk-upload
- **Query-string endpoints**: check-photo, download-photo, generate-qr, list-photos, cleanup-photos

### Frontend Patterns

- **booth.js is the central orchestrator** - creates all subsystem instances, wires callbacks, manages state
- **`Config.js` is a singleton** — fetched once, cached, dot-notation access
- **`Lang.js` is a plain object** (not a class) — Indonesian primary, English fallback
- **Shared utility**: `SharedActions.js` used by both `ModalManager` (booth page) and `GalleryPage` (gallery page)
- **Queue retry uses re-entrancy guard** — `_retryingIds` Set prevents concurrent `retryItem()` calls for the same item. Button is disabled synchronously (before any `await`). Network errors do NOT increment retry counter.
- **Page-level modules** (GalleryPage, QueuePage) are standalone — they have their own modal logic
- **Service worker versioning**: Version sourced from `version.json` via `AppConfig::getAppVersion()` in PHP pages. Page-side check compares `localStorage.kidversa_sw_version` with current version — mismatch triggers cache clear + reload. SW itself reads `version.json` at install to set dynamic `CACHE_NAME`. All CSS links use `?v=X.Y.Z` query strings for HTTP cache busting.
- **Mirror toggles**: `MirrorToggleUI.js` creates horizontal/vertical mirror toggle badges, read from `CameraManager.mirrorH`/`mirrorV` and persisted via localStorage

### Security

- **Path traversal prevention**: `PathHelper::getSafeUploadPath()` uses realpath + prefix check
- **Filename validation**: Regex `[a-zA-Z0-9._-]` max 255 chars via `ValidationHelper::validateFilename()`
- **Upload validation**: 10MB max, MIME via `finfo`, only PNG/JPEG/WebP via `ValidationHelper::validateUploadedFile()`
- **`.htaccess`** blocks `.env`, hides PHP execution in uploads, sends security headers (XFO, CSP, HSTS)
- **Security headers on all API endpoints**: `sendApiSecurityHeaders()` — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Cache-Control no-store
- **Permissions-Policy in root `.htaccess`**: `camera=(self), microphone=(self), geolocation=(self)` — restricts sensor access to same-origin only

## Common Pitfalls

- **`E_STRICT` removed in PHP 8.4.** Never use `E_STRICT` in `error_reporting()` — `bootstrap.php` handles this.
- **Docker volume mounts corrupt `vendor/`.** If `composer dump-autoload` fails with permission denied, delete `vendor/` and reinstall.
- **`.htaccess` in `public/`** blocks access to `.env` and other sensitive files. Don't remove it.
- **Upload dir permissions:** `mkdir` uses `0755`, not `0777`. `public/uploads/.htaccess` disables PHP execution.
- **`public/api/index.php` was deleted.** It was part of the dead Router system removed in commit `3d0acfe`. No router entry point exists.
- **`booth.js` uses ES modules** (`import`/`export`). Loaded as `<script type="module">` in `take-photo.php`.
- **`window.booth`** is the global Booth instance — only used inside `booth.js` itself (8 references).
- **Service worker cache.** Deploy: bump `public/version.json` only. SW reads it dynamically; PHP pages read it via `AppConfig::getAppVersion()`. CSS links auto-version via `?v=`. See `DEPLOY.md` for full checklist. `nginx-cache.conf` is a reference config for production Nginx headers (copy blocks to VPS).
- **Chunk storage cleanup.** `storage/chunks/` is NOT auto-cleaned by the main cleanup endpoint. Run `cron/cleanup-chunks.php` hourly via cron for production.
- **IndexedDB queue persistence.** `OperationQueue` stores pending uploads in IndexedDB (`KidversaQueue` v3 with `claimedBy`/`claimedAt` fields). Clearing browser storage will lose the queue. Stale entries for already-uploaded files are cleaned on page load. Stale "uploading" claims (>30s) reset to "captured" via `resetStaleClaims()`.
- **CSRF on chunked uploads.** All three chunk endpoints require CSRF in the request body. `ChunkUploader.js` handles token injection.
- **No test suite.** Manual testing flow: upload photo → view photo → download/email/QR.
- **`GalleryPage` has its own modal logic** — it does NOT import `ModalManager`. It directly manages `printModal`/`qrModal`/`emailModal` DOM and uses `SharedActions`.
- **`EnvHelper` is a simple parser** that handles only basic `KEY=VALUE` lines with `trim()`. No multiline, no quotes stripping, no variable interpolation.
- **All API responses now include `success` field** — even on errors (`{success: false, message: "..."}`). Don't add endpoints without this field.
- **`design_template/` removed.** Was gitignored and no longer present in the working directory.
- **`CameraManager` now manages devices** — `mirrorH`, `mirrorV`, `currentDeviceId`, `devices[]` fields. Camera select dropdown and mirror toggles are built by `booth.js` and wired through `CameraManager`.
