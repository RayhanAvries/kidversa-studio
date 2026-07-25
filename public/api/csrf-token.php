<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

$token = CsrfHelper::generateToken();

echo json_encode([
    'success' => true,
    'token' => $token,
]);
