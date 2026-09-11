<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

if (str_starts_with($uri, '/api/')) {
    require __DIR__ . '/api.php';
    return true;
}

$frontend = realpath(__DIR__ . '/../frontend');
$assets = realpath(__DIR__ . '/../../assets');

function guess_type(string $file): string
{
    $map = [
        'html' => 'text/html; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'js' => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff2' => 'font/woff2',
    ];
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    return $map[$ext] ?? 'application/octet-stream';
}

function under_root(string $file, string $root): bool
{
    $file = strtolower(str_replace('\\', '/', $file));
    $root = rtrim(strtolower(str_replace('\\', '/', $root)), '/');
    return str_starts_with($file, $root . '/');
}

function send_file(string $file): bool
{
    if (!is_file($file)) {
        return false;
    }
    header('Content-Type: ' . guess_type($file));
    header('Content-Length: ' . filesize($file));
    readfile($file);
    return true;
}

if ($uri === '/') {
    send_file($frontend . '/index.html');
    return true;
}

if (str_starts_with($uri, '/assets/') && $assets) {
    $file = realpath($assets . substr($uri, strlen('/assets')));
    if ($file && under_root($file, $assets) && send_file($file)) {
        return true;
    }
}

$file = realpath($frontend . $uri);
if ($file && under_root($file, $frontend) && send_file($file)) {
    return true;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not found';
return true;
