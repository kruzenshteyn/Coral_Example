<?php

require_once __DIR__ . '/store.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';

function json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json($data, int $status = 200, bool $ok = true): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $payload = $ok ? ['ok' => true, 'data' => $data] : ['ok' => false, 'error' => $data];
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function require_user(): array
{
    $store = load_store();
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) {
        send_json('Unauthorized', 401, false);
    }
    $user = find_user_by_id($store, $id);
    if (!$user) {
        unset($_SESSION['user_id']);
        send_json('Unauthorized', 401, false);
    }
    return [$store, $user];
}

if ($method === 'GET' && $path === '/api/products') {
    send_json(load_products());
}

if ($method === 'GET' && preg_match('#^/api/products/([^/]+)$#', $path, $match)) {
    $product = find_product(urldecode($match[1]));
    if (!$product) {
        send_json('Product not found', 404, false);
    }
    send_json($product);
}

if ($method === 'POST' && $path === '/api/auth/register') {
    $body = json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if (strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        send_json('Invalid registration data', 400, false);
    }
    $store = load_store();
    if (find_user_by_email($store, $email)) {
        send_json('Email already registered', 409, false);
    }
    $user = [
        'id' => count($store['users']) + 1,
        'name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ];
    $store['users'][] = $user;
    write_store($store);
    $_SESSION['user_id'] = $user['id'];
    send_json(public_user($user));
}

if ($method === 'POST' && $path === '/api/auth/login') {
    $body = json_body();
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $store = load_store();
    $user = find_user_by_email($store, $email);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_json('Invalid email or password', 401, false);
    }
    $_SESSION['user_id'] = $user['id'];
    send_json(public_user($user));
}

if ($method === 'POST' && $path === '/api/auth/logout') {
    unset($_SESSION['user_id']);
    send_json(null);
}

if ($method === 'GET' && $path === '/api/me') {
    [, $user] = require_user();
    send_json(public_user($user));
}

if ($method === 'GET' && $path === '/api/orders') {
    [$store, $user] = require_user();
    $orders = array_values(array_filter($store['orders'], function ($order) use ($user) {
        return (int) $order['user_id'] === (int) $user['id'];
    }));
    send_json(array_map(function ($order) {
        return [
            'id' => $order['id'],
            'productId' => $order['product_id'],
            'createdAt' => $order['created_at'],
        ];
    }, $orders));
}

if ($method === 'POST' && $path === '/api/orders') {
    [$store, $user] = require_user();
    $productId = (string) (json_body()['productId'] ?? '');
    if (!find_product($productId)) {
        send_json('Product not found', 404, false);
    }
    foreach ($store['orders'] as $order) {
        if ((int) $order['user_id'] === (int) $user['id'] && $order['product_id'] === $productId) {
            send_json([
                'id' => $order['id'],
                'productId' => $order['product_id'],
                'createdAt' => $order['created_at'],
            ]);
        }
    }
    $order = [
        'id' => count($store['orders']) + 1,
        'user_id' => $user['id'],
        'product_id' => $productId,
        'created_at' => gmdate('c'),
    ];
    $store['orders'][] = $order;
    write_store($store);
    send_json([
        'id' => $order['id'],
        'productId' => $order['product_id'],
        'createdAt' => $order['created_at'],
    ]);
}

send_json('Not found', 404, false);
