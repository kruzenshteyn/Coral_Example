<?php

require_once __DIR__ . '/db.php';

session_start();
db();

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
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) {
        send_json('Unauthorized', 401, false);
    }
    $user = find_user_by_id($id);
    if (!$user) {
        unset($_SESSION['user_id']);
        send_json('Unauthorized', 401, false);
    }
    return $user;
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
    if (find_user_by_email($email)) {
        send_json('Email already registered', 409, false);
    }
    $user = create_user($name, $email, $password);
    $_SESSION['user_id'] = $user['id'];
    send_json(public_user($user));
}

if ($method === 'POST' && $path === '/api/auth/login') {
    $body = json_body();
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $user = find_user_by_email($email);
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
    send_json(public_user(require_user()));
}

if ($method === 'GET' && $path === '/api/orders') {
    $user = require_user();
    send_json(list_selected((int) $user['id']));
}

if ($method === 'POST' && $path === '/api/orders') {
    $user = require_user();
    $productId = (string) (json_body()['productId'] ?? '');
    if (!find_product($productId)) {
        send_json('Product not found', 404, false);
    }
    send_json(add_selected((int) $user['id'], $productId));
}

function require_admin(): array
{
    $user = require_user();
    if ((int) ($user['is_admin'] ?? 0) !== 1) {
        send_json('Forbidden', 403, false);
    }
    return $user;
}

if ($method === 'GET' && $path === '/api/cart') {
    $user = require_user();
    send_json(list_cart((int) $user['id']));
}

if ($method === 'POST' && $path === '/api/cart') {
    $user = require_user();
    $body = json_body();
    $productId = (string) ($body['productId'] ?? '');
    $quantity = (int) ($body['quantity'] ?? 1);
    if (!find_product($productId)) {
        send_json('Product not found', 404, false);
    }
    send_json(add_to_cart((int) $user['id'], $productId, $quantity));
}

if ($method === 'POST' && $path === '/api/cart/update') {
    $user = require_user();
    $body = json_body();
    $productId = (string) ($body['productId'] ?? '');
    $quantity = (int) ($body['quantity'] ?? 0);
    set_cart_quantity((int) $user['id'], $productId, $quantity);
    send_json(list_cart((int) $user['id']));
}

if ($method === 'POST' && $path === '/api/checkout') {
    $user = require_user();
    $order = checkout((int) $user['id']);
    if (!$order) {
        send_json('Cart is empty', 400, false);
    }
    send_json($order);
}

if ($method === 'GET' && $path === '/api/purchases') {
    $user = require_user();
    send_json(list_orders((int) $user['id']));
}

if ($method === 'POST' && $path === '/api/admin/products') {
    require_admin();
    $body = json_body();
    $title = trim((string) ($body['title'] ?? ''));
    $price = (float) ($body['price'] ?? 0);
    if ($title === '' || $price <= 0) {
        send_json('Title and price are required', 400, false);
    }
    send_json(create_product($body));
}

send_json('Not found', 404, false);
