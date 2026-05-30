<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title><?php echo $pageTitle ?? 'Kidversa Studio'; ?></title>
    <link rel="icon" type="image/png" href="/favicon.png?v=1">
    <link rel="icon" sizes="32x32" href="/favicon.png?v=1">
    <link rel="apple-touch-icon" href="/favicon.png?v=1">
    <?php if (isset($pageCss)): ?>
        <?php foreach ($pageCss as $css): ?>
            <link rel="stylesheet" href="<?php echo $css; ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
