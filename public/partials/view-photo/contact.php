<div class="contact-card">
    <h3 class="contact-title">Hubungi Kami</h3>
    <div class="contact-grid">
        <div class="contact-item">
            <a href="<?php echo $mapsUrl ? htmlspecialchars($mapsUrl) : '#'; ?>" target="_blank" class="contact-link">
                <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="contact-label">Lokasi</div>
                <div class="contact-value" id="location-value"><?php echo htmlspecialchars($locationName); ?></div>
            </a>
        </div>
        <div class="contact-item">
            <a href="<?php echo htmlspecialchars($mailtoUrl); ?>" class="contact-link">
                <div class="contact-icon"><i class="fas fa-envelope"></i></div>
                <div class="contact-label">Email</div>
                <div class="contact-value"><?php echo htmlspecialchars($contactEmail); ?></div>
            </a>
        </div>
        <div class="contact-item">
            <a href="tel:+6281234567890" class="contact-link">
                <div class="contact-icon"><i class="fas fa-phone"></i></div>
                <div class="contact-label">Telepon</div>
                <div class="contact-value">+62 812-3456-7890</div>
            </a>
        </div>
    </div>
</div>
