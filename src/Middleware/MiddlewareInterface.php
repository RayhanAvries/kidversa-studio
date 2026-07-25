<?php

declare(strict_types=1);

namespace Kidversa\Middleware;

interface MiddlewareInterface
{
    public function handle(callable $next): void;
}
