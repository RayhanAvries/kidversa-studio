<?php
namespace Kidversa\Middleware;

class JsonResponseMiddleware implements MiddlewareInterface {
    public function handle(callable $next): void {
        header('Content-Type: application/json');
        $next();
    }
}
