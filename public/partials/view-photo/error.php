<?php /** @var bool $isExpired */ ?>
<section class="error-section">
    <div class="error-icon"><i class="fas fa-<?php echo ($isExpired ? 'clock' : 'image'); ?>"></i></div>
    <h2 class="error-title"><?php echo ($isExpired ? 'Foto Telah Kadaluarsa' : 'Foto Tidak Ditemukan'); ?></h2>
    <p class="error-text"><?php echo ($isExpired ? 'Waktu penyimpanan foto ini telah habis (batas maksimal 24 jam).' : 'Pastikan tautan benar atau ambil foto baru.'); ?></p>
    <a href="/take-photo.php" class="btn btn-primary"><i class="fas fa-camera"></i><?php echo ($isExpired ? 'Ambil Foto Baru' : 'Ambil Foto'); ?></a>
</section>
