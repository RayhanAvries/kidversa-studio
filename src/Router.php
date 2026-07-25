<?php
namespace Kidversa;

class Router {
    private array $routes = [];
    private array $middleware = [];

    public function addRoute(string $method, string $path, callable $handler): void {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function get(string $path, callable $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function delete(string $path, callable $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    public function addMiddleware(callable $middleware): void {
        $this->middleware[] = $middleware;
    }

    public function addMiddlewareObject(\Kidversa\Middleware\MiddlewareInterface $middleware): void {
        $this->middleware[] = function (callable $next) use ($middleware) {
            $middleware->handle($next);
        };
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as $route) {
            $routePath = rtrim($route['path'], '/') ?: '/';
            
            if ($route['method'] === $method && $routePath === $uri) {
                $this->runMiddlewareStack(function () use ($route) {
                    call_user_func($route['handler']);
                });
                return;
            }
        }

        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
    }

    private function runMiddlewareStack(callable $final): void {
        $stack = $final;
        
        for ($i = count($this->middleware) - 1; $i >= 0; $i--) {
            $middleware = $this->middleware[$i];
            $next = $stack;
            $stack = function () use ($middleware, $next) {
                return $middleware($next);
            };
        }

        call_user_func($stack);
    }
}
