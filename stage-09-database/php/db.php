<?php

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    $pdo = new PDO('sqlite:' . $dir . '/coral.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $schema = file_get_contents(dirname(__DIR__) . '/data/schema.sql');
    $pdo->exec($schema);
    seed_products($pdo);
    seed_admin($pdo);
    return $pdo;
}

function seed_products(PDO $pdo): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    if ($count > 0) {
        return;
    }
    $file = dirname(__DIR__) . '/data/products.json';
    $rows = json_decode(file_get_contents($file), true) ?: [];
    $stmt = $pdo->prepare(
        'INSERT INTO products (id, title, category, price, old_price, image, badge, bestseller, description)
         VALUES (:id, :title, :category, :price, :old_price, :image, :badge, :bestseller, :description)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':title' => $row['title'],
            ':category' => $row['category'],
            ':price' => $row['price'],
            ':old_price' => $row['oldPrice'] ?? null,
            ':image' => $row['image'],
            ':badge' => $row['badge'] ?? null,
            ':bestseller' => !empty($row['bestseller']) ? 1 : 0,
            ':description' => $row['description'] ?? '',
        ]);
    }
}

function seed_admin(PDO $pdo): void
{
    $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute(['admin@coral.local']);
    if ($exists->fetch()) {
        return;
    }
    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)'
    );
    $stmt->execute(['Admin', 'admin@coral.local', password_hash('admin123', PASSWORD_DEFAULT)]);
}

function product_to_api(array $row): array
{
    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'category' => $row['category'],
        'price' => (float) $row['price'],
        'oldPrice' => $row['old_price'] === null ? null : (float) $row['old_price'],
        'image' => $row['image'],
        'badge' => $row['badge'],
        'bestseller' => (int) $row['bestseller'] === 1,
        'description' => $row['description'],
    ];
}

function public_user(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'isAdmin' => (int) ($user['is_admin'] ?? 0) === 1,
    ];
}

function load_products(): array
{
    $rows = db()->query('SELECT * FROM products ORDER BY title')->fetchAll(PDO::FETCH_ASSOC);
    return array_map('product_to_api', $rows);
}

function find_product(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? product_to_api($row) : null;
}

function find_user_by_email(string $email): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE lower(email) = lower(?)');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function find_user_by_id($id): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([(int) $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function create_user(string $name, string $email, string $password): array
{
    $stmt = db()->prepare(
        'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 0)'
    );
    $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
    return find_user_by_id((int) db()->lastInsertId());
}

function list_selected(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT id, product_id, created_at FROM selected_products WHERE user_id = ? ORDER BY id'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'productId' => $row['product_id'],
            'createdAt' => $row['created_at'],
        ];
    }, $rows);
}

function add_selected(int $userId, string $productId): array
{
    $stmt = db()->prepare(
        'SELECT id, product_id, created_at FROM selected_products WHERE user_id = ? AND product_id = ?'
    );
    $stmt->execute([$userId, $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return [
            'id' => (int) $row['id'],
            'productId' => $row['product_id'],
            'createdAt' => $row['created_at'],
        ];
    }
    $created = gmdate('c');
    $insert = db()->prepare(
        'INSERT INTO selected_products (user_id, product_id, created_at) VALUES (?, ?, ?)'
    );
    $insert->execute([$userId, $productId, $created]);
    return [
        'id' => (int) db()->lastInsertId(),
        'productId' => $productId,
        'createdAt' => $created,
    ];
}
