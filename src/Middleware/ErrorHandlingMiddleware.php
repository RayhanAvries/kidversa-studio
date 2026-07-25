<?php

declare(strict_types=1);

namespace Kidversa\Middleware;

class ErrorHandlingMiddleware implements MiddlewareInterface
{
    public function handle(callable $next): void
    {
        set_exception_handler(static function (\Throwable $e): void {
            http_response_code(500);
            header('Content-Type: application/json');
            $message = $e->getMessage();
            if (\Kidversa\Helpers\EnvHelper::get('APP_DEBUG', 'false') === 'true') {
                $message .= ' in ' . $e->getFile() . ':' . $e->getLine();
            }
            echo json_encode([
                'success' => false,
                'message' => $message,
            ]);
        });

        set_error_handler(static function ($severity, $message, $file, $line): void {
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });

        $next();
    }
}
