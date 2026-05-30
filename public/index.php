<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Kidversa Studio</title>
    <link rel="icon" href="favicon.png" type="image/png">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <div class="dot-pattern"></div>
    <div class="blob blob-purple"></div>
    <div class="blob blob-yellow"></div>
    <div class="blob blob-purple-sm"></div>
    <div class="scene">
        <div class="logo-stage">
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-core">
                <img src="assets/img/logo.png" alt="Kidversa Studio Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo-fallback"><i class="fas fa-star"></i></div>
            </div>
        </div>
        <div class="brand-block">
            <h1 class="brand-title">Kidversa <span class="accent">Studio</span></h1>
            <p class="brand-sub">Creative Visuals</p>
        </div>
        <a href="take-photo.php" class="btn-trigger" id="startButton">Start Capture</a>
    </div>
    <script>
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', function(e){e.preventDefault();window.location.href='take-photo.php';});
    </script>
</body>
</html>
