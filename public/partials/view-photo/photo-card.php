<div class="photo-card">
    <div class="photo-preview">
        <img src="/uploads/photos/<?php echo htmlspecialchars($filename); ?>" alt="Foto Kenangan">
        <span class="photo-badge"><?php echo htmlspecialchars($fileExtension); ?></span>
    </div>
    <div class="photo-info">
        <h1 class="photo-title">Foto Kenangan Anda</h1>
        <p class="photo-subtitle">Dokumentasi istimewa yang tersimpan untuk Anda</p>
        <div class="info-grid">
            <div class="info-item">
                <i class="fas fa-calendar-alt"></i>
                <div>
                    <div class="info-label">Tanggal</div>
                    <div class="info-value"><?php echo htmlspecialchars($formattedDate); ?></div>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-clock"></i>
                <div>
                    <div class="info-label">Waktu</div>
                    <div class="info-value"><?php echo htmlspecialchars($formattedTime); ?></div>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-expand"></i>
                <div>
                    <div class="info-label">Ukuran</div>
                    <div class="info-value"><?php echo htmlspecialchars($dimensionsStr); ?></div>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-file-alt"></i>
                <div>
                    <div class="info-label">File</div>
                    <div class="info-value"><?php echo htmlspecialchars($fileSizeStr); ?></div>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <div class="info-label">Lokasi</div>
                    <div class="info-value"><?php echo htmlspecialchars($locationName); ?></div>
                </div>
            </div>
        </div>
        <div class="action-buttons">
            <a href="/api/download-photo.php?file=<?php echo urlencode($filename); ?>" class="btn btn-primary" download>
                <i class="fas fa-download"></i>Unduh HD
            </a>
            <button class="btn btn-secondary" onclick="copyToClipboard()">
                <i class="fas fa-share-alt"></i>Bagikan
            </button>
        </div>
    </div>
</div>
