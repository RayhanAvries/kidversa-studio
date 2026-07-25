<?php
namespace Kidversa\Middleware;

interface MiddlewareInterface {
    public function handle(callable $next): void;
}
