<?php

function store_paths(): array
{
    return [
        'products' => dirname(__DIR__) . '/data/products.json',
        'store' => __DIR__ . '/data/store.json',
    ];
}

function read_json_file(string $path, $fallback)
{
    if (!is_file($path)) {
        return $fallback;
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $fallback;
}

function write_store(array $store): void
{
    $path = store_paths()['store'];
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    $fh = fopen($path, 'c+');
    if (!$fh) {
        throw new RuntimeException('Cannot write store');
    }
    flock($fh, LOCK_EX);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

function load_store(): array
{
    $store = read_json_file(store_paths()['store'], []);
    if (!isset($store['users']) || !is_array($store['users'])) {
        $store['users'] = [];
    }
    if (!isset($store['orders']) || !is_array($store['orders'])) {
        $store['orders'] = [];
    }
    return $store;
}

function load_products(): array
{
    return read_json_file(store_paths()['products'], []);
}

function public_user(array $user): array
{
    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
    ];
}

function find_product(string $id): ?array
{
    foreach (load_products() as $product) {
        if (($product['id'] ?? '') === $id) {
            return $product;
        }
    }
    return null;
}

function find_user_by_email(array $store, string $email): ?array
{
    foreach ($store['users'] as $user) {
        if (strcasecmp($user['email'], $email) === 0) {
            return $user;
        }
    }
    return null;
}

function find_user_by_id(array $store, $id): ?array
{
    foreach ($store['users'] as $user) {
        if ((int) $user['id'] === (int) $id) {
            return $user;
        }
    }
    return null;
}
