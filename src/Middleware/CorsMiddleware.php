<?php
namespace Kidversa\Middleware;

class CorsMiddleware implements MiddlewareInterface {
    private string $allowedOrigin;

    public function __construct(string $allowedOrigin = '*') {
        $this->allowedOrigin = $allowedOrigin;
    }

    public function handle(callable $next): void {
        header("Access-Control-Allow-Origin: {$this->allowedOrigin}");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $next();
    }
}
