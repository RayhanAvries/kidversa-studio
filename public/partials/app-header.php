<?php
$activePage = $activePage ?? 'take-photo';
$showNav = $showNav ?? true;
?>
<header class="app-header">
    <div class="app-header-inner">
        <a href="/index.php" class="app-brand" aria-label="Kidversa Studio Home">
            <img src="/assets/img/logo.png" alt="" class="app-brand-logo" width="28" height="28"
                 onerror="this.style.display='none'">
            <span class="app-brand-name">Kidversa <span class="app-brand-accent">Studio</span></span>
        </a>
        <?php if ($showNav): ?>
        <nav class="app-nav" aria-label="Main navigation">
            <a href="/take-photo.php" class="app-nav-tab<?php echo $activePage === 'take-photo' ? ' active' : ''; ?>">Take Photo</a>
            <a href="/gallery.php" class="app-nav-tab<?php echo $activePage === 'gallery' ? ' active' : ''; ?>">Gallery</a>
            <a href="/queue.php" class="app-nav-tab<?php echo $activePage === 'queue' ? ' active' : ''; ?>">Queue</a>
        </nav>
        <?php endif; ?>
    </div>
</header>
