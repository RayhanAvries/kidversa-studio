<?php
namespace Kidversa\Middleware;

use Kidversa\Helpers\CsrfHelper;

class CsrfMiddleware implements MiddlewareInterface {
    public function handle(callable $next): void {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($contentType, 'application/json') !== false) {
                $input = json_decode(file_get_contents('php://input'), true);
                $token = $input['csrf_token'] ?? null;
            } else {
                $token = $_POST['csrf_token'] ?? null;
            }

            if (!CsrfHelper::validateToken($token)) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid CSRF token'
                ]);
                return;
            }
        }

        $next();
    }
}
