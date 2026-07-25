<?php
namespace Kidversa\Middleware;

use Kidversa\Helpers\RateLimitHelper;

class RateLimitMiddleware implements MiddlewareInterface {
    private string $key;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(string $key, int $maxRequests, int $windowSeconds) {
        $this->key = $key;
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    public function handle(callable $next): void {
        if (!RateLimitHelper::isAllowed($this->key, $this->maxRequests, $this->windowSeconds)) {
            http_response_code(429);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Rate limit exceeded. Please try again later.'
            ]);
            return;
        }

        $next();
    }
}
