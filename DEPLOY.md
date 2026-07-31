# Deployment Checklist

## Environment

- **Development:** Docker (php:8.4-apache) — `docker-compose up -d`
- **Production:** Nginx + PHP-FPM di VPS — `git pull`

## Pre-Deploy

1. ✅ Ubah `public/version.json` ke versi baru

   ```json
   {"version": "4.3.2"}
   ```

2. ✅ Jalankan `composer cs:check` untuk pastikan formatting benar
3. ✅ Test di Docker dev: `docker-compose up -d`
4. ✅ Buka semua halaman, pastikan CSS/JS fresh
5. ✅ Commit semua perubahan

## Deploy (Production VPS)

```bash
# SSH ke VPS
ssh kidversa@server

# Navigate ke project
cd /var/www/kidversa.fun/kidversa-studio

# Pull perubahan
git pull origin v4.4

# Tidak perlu restart PHP-FPM (OPcache validate_timestamps=On)
# Tidak perlu reload Nginx (kecuali nginx.conf berubah)
```

## Post-Deploy Verification

1. ✅ Buka site di browser
2. ✅ Buka DevTools → Console
3. ✅ Pastikan log `[SW] Version from version.json: X.Y.Z` muncul
4. ✅ Buka DevTools → Application → Cache Storage
5. ✅ Pastikan cache name: `kidversa-vX.Y.Z` (version baru)
6. ✅ Buka DevTools → Network → filter CSS
7. ✅ Pastikan request memiliki `?v=X.Y.Z`
8. ✅ Ubah `version.json` lagi → refresh → pastikan cache update

## Rollback (jika perlu)

1. Ubah `public/version.json` ke versi sebelumnya
2. Commit + push
3. Pull di VPS
4. User akan otomatis fetch version baru

## Troubleshooting

### CSS/JS masih stale setelah deploy

1. Cek `version.json` sudah di-bump?
2. Cek DevTools → Console → `[SW] Version` log
3. Cek DevTools → Cache Storage → cache name sudah berubah?
4. Hard refresh (Ctrl+F5) untuk test

### SW tidak register

1. Cek DevTools → Application → Service Workers
2. Pastikan tidak ada error di Console
3. Cek `sw.js` bisa diakses: `curl https://studio.kidversa.fun/sw.js`

### Nginx cache headers tidak muncul

1. Cek nginx.conf sudah di-update?
2. Jalankan `sudo nginx -t` untuk test config
3. Reload: `sudo systemctl reload nginx`
4. Cek: `curl -I https://studio.kidversa.fun/assets/css/capture.css`

## Nginx Configuration

### Cache Headers (di `/etc/nginx/sites-enabled/kidversa.conf`)

```nginx
# CSS/JS: aggressive cache (invalidated via query string)
location ~* \.(css|js)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options "nosniff";
}

# Images: moderate cache (1 day)
location ~* \.(png|jpg|jpeg|gif|webp|svg|ico)$ {
    add_header Cache-Control "public, max-age=86400";
    add_header X-Content-Type-Options "nosniff";
}

# Fonts: long cache (1 year)
location ~* \.(woff|woff2|ttf|eot|otf)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### Update Nginx Config

```bash
sudo nano /etc/nginx/sites-enabled/kidversa.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Version Bumping Rules

### Kapan HARUS bump version.json

- ✅ Perubahan CSS (design, layout, warna)
- ✅ Perubahan JavaScript (behavior, fitur)
- ✅ Perubahan images yang di-cache (logo, icons)
- ✅ Perubahan filters.json
- ✅ Setiap deploy ke production

### Karena TIDAK PERLU bump version.json

- ❌ Perubahan PHP files (tanpa perubahan CSS/JS)
- ❌ Perubahan API responses
- ❌ Perubahan data (photos, metadata)
- ❌ Perubahan .env
