<?php
namespace Kidversa\Helpers;

class ResponseHelper {
    public static function success(mixed $data = null, string $message = ''): void {
        header('Content-Type: application/json');
        $response = ['success' => true];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        echo json_encode($response);
    }

    public static function error(string $message, int $statusCode = 400, mixed $data = null): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
    }

    public static function paginated(array $data, int $total, int $page, int $perPage): void {
        header('Content-Type: application/json');
        
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage)
            ]
        ]);
    }

    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    public static function rateLimited(string $message = 'Rate limit exceeded'): void {
        self::error($message, 429);
    }

    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }
}
