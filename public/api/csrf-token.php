<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\CsrfHelper;

header('Content-Type: application/json');

$token = CsrfHelper::generateToken();

echo json_encode([
    'success' => true,
    'token' => $token
]);
