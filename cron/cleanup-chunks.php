<?php
// Add to crontab: 0 * * * * php /path/to/kidversa-studio/cron/cleanup-chunks.php

require_once __DIR__ . '/../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;

ChunkAssemblyHelper::cleanupStale(3600);

echo "Stale chunks cleaned up at " . date('Y-m-d H:i:s') . "\n";
