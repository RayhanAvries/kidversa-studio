# AGENTS.md

## What This Is

Kidversa Studio — a PHP photo booth web app (camera capture, filters, frames, email, QR download). No framework, PSR-4 autoloading, Apache + Docker.

## Running Locally

### Docker (preferred)
```bash
docker-compose up -d
# App at http://localhost
```

### Laragon / XAMPP
- Set document root to `public/`
- PHP >= 8.1 required (8.4 recommended)
- Copy `.env.example` → `.env`, fill in SMTP values and `STUDIO_EMAIL`

### Composer
```bash
composer install          # first time
composer dump-autoload    # if vendor/ is corrupted
```
**Windows gotcha:** If `composer dump-autoload` fails with "Permission denied" on `vendor/composer/`, delete `vendor/` entirely and re-run `composer install`. This happens when Docker creates files as root then Windows can't overwrite them.

## Project Structure

```
src/                     # PHP backend (PSR-4: Kidversa\)
  bootstrap.php          # Autoloader, .env, session, timezone — included by all API files
  Config/                # AppConfig (facade), StudioConfig, PhotoConfig, EmailConfig, UiConfig, EnvValidator
  Controllers/           # PhotoController
  Helpers/               # ValidationHelper, CsrfHelper, PathHelper, RateLimitHelper, SecurityHelper, ResponseHelper, EnvHelper, FileHelper
  Services/              # PhotoService, EmailService, FrameService
  Middleware/             # MiddlewareInterface + 5 implementations (not yet wired to router)
  Router.php             # Simple router (not yet used by standalone endpoints)

public/                  # Web root (Apache DocumentRoot)
  api/                   # Standalone PHP endpoints (NOT routed through Router.php yet)
    config.php           # Returns app config as JSON
    save-photo.php       # Upload photo (POST, multipart)
    delete-photo.php     # Delete photo (POST)
    send-email.php       # Send photo via email (POST, JSON)
    download-photo.php   # Download photo (GET)
    check-photo.php      # Check if photo exists (GET)
    cleanup-photos.php   # Delete expired photos (GET, rate-limited + CSRF)
    frames.php           # List available frames (GET)
    generate-qr.php      # Generate QR code image (GET, rate-limited)
    csrf-token.php       # Generate CSRF token (GET)
    index.php            # Router entry point (unused — standalone files handle requests directly)
  assets/
    js/booth.js          # Main app logic (~677 lines)
    js/modules/           # CameraManager, FilterEngine, FrameManager, BoothUI, Config, Lang, ModalManager, HandDetection, HandDetectionUI, InitPermissions
    css/                  # main.css, capture.css, view-photo.css
    config/filters.json   # Filter definitions
    img/                  # logo.png, frames/
  partials/              # PHP includes (modals/, view-photo/)
  uploads/photos/        # Uploaded photos (gitignored, auto-created)
```

## Key Architecture Decisions

- **No framework.** Custom bootstrap, standalone API files, manual routing.
- **Router exists but is unused.** `src/Router.php` and `src/Middleware/` are built but standalone `public/api/*.php` files handle requests directly. Don't assume the router is active.
- **CSRF on POST endpoints.** Frontend fetches token from `api/csrf-token.php`, includes in POST body (`csrf_token` field). `cleanup-photos.php` also requires CSRF token as GET param.
- **File-based rate limiting.** Stored in `storage/ratelimit/` (gitignored, auto-created).
- **All API files include `src/bootstrap.php`** which loads autoloader, .env, starts session, sets timezone.
- **Config split.** `AppConfig` is a backward-compatible facade over `StudioConfig`, `PhotoConfig`, `EmailConfig`, `UiConfig`. New code should use domain-specific config classes.

## .env Required Variables

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, BASE_URL, STUDIO_EMAIL
```
Optional: `APP_DEBUG`, `APP_TIMEZONE`. See `.env.example`.

## Code Style

- PHP: 4 spaces, PSR-12 / PER-CS1.0
- JS: 2 spaces
- CSS: 2 spaces
- Enforced by `.editorconfig` + `.php-cs-fixer.dist.php`

### Formatting Commands
```bash
composer cs              # auto-fix PHP formatting
composer cs:check        # dry-run check (CI uses this)
```

## CI

GitHub Actions on push to `main` / `v4.1`:
1. PHP syntax check (`php -l` on all `.php` files)
2. `composer validate --strict`
3. Docker build + health check

## Common Pitfalls

- **`E_STRICT` removed in PHP 8.4.** Never use `E_STRICT` in `error_reporting()` — it's deprecated.
- **Docker volume mounts corrupt `vendor/`.** If `composer dump-autoload` fails with permission denied, delete `vendor/` and reinstall.
- **`.htaccess` in `public/`** blocks access to `.env` and other sensitive files. Don't remove it.
- **Upload dir permissions:** `mkdir` uses `0755`, not `0777`. The `public/uploads/.htaccess` disables PHP execution in uploads.
- **`public/api/index.php` is the router entry point** but is NOT used. Standalone files in `public/api/` handle requests directly. If you add a route in `index.php`, nothing will call it unless you also update the `.htaccess` rewrite rules and frontend JS.
- **`booth.js` uses ES modules** (`import`/`export`). It's loaded as `<script type="module">` in `take-photo.php`.
- **`window.booth`** is the global Booth instance. Some legacy code still references it. The `ModalManager` class handles modal logic — don't put modal handlers back on `window.*` globals.
- **No test suite.** There are no PHPUnit tests. Manual testing flow: upload photo → view photo → download/email/QR.
