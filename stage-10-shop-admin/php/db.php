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

function cart_to_api(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'productId' => $row['product_id'],
        'quantity' => (int) $row['quantity'],
        'title' => $row['title'],
        'price' => (float) $row['price'],
        'image' => $row['image'],
        'lineTotal' => (float) $row['price'] * (int) $row['quantity'],
    ];
}

function list_cart(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image
         FROM cart_items c JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ? ORDER BY c.id'
    );
    $stmt->execute([$userId]);
    return array_map('cart_to_api', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function add_to_cart(int $userId, string $productId, int $quantity): array
{
    $quantity = max(1, $quantity);
    $found = db()->prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?');
    $found->execute([$userId, $productId]);
    $row = $found->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $stmt = db()->prepare('UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?');
        $stmt->execute([$quantity, $userId, $productId]);
    } else {
        $stmt = db()->prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $productId, $quantity]);
    }
    $items = list_cart($userId);
    foreach ($items as $item) {
        if ($item['productId'] === $productId) {
            return $item;
        }
    }
    return $items[0];
}

function set_cart_quantity(int $userId, string $productId, int $quantity): void
{
    if ($quantity < 1) {
        $stmt = db()->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?');
        $stmt->execute([$userId, $productId]);
        return;
    }
    $stmt = db()->prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?');
    $stmt->execute([$quantity, $userId, $productId]);
}

function checkout(int $userId): array
{
    $items = list_cart($userId);
    if (!$items) {
        return [];
    }
    $pdo = db();
    $pdo->beginTransaction();
    $created = gmdate('c');
    $pdo->prepare('INSERT INTO orders (user_id, created_at) VALUES (?, ?)')->execute([$userId, $created]);
    $orderId = (int) $pdo->lastInsertId();
    $insert = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($items as $item) {
        $insert->execute([$orderId, $item['productId'], $item['title'], $item['quantity'], $item['price']]);
    }
    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?')->execute([$userId]);
    $pdo->commit();
    return get_order($userId, $orderId);
}

function get_order(int $userId, int $orderId): ?array
{
    $stmt = db()->prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?');
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        return null;
    }
    $items = db()->prepare('SELECT product_id, title, quantity, price FROM order_items WHERE order_id = ?');
    $items->execute([$orderId]);
    $lines = $items->fetchAll(PDO::FETCH_ASSOC);
    $total = 0;
    $mapped = [];
    foreach ($lines as $line) {
        $lineTotal = (float) $line['price'] * (int) $line['quantity'];
        $total += $lineTotal;
        $mapped[] = [
            'productId' => $line['product_id'],
            'title' => $line['title'],
            'quantity' => (int) $line['quantity'],
            'price' => (float) $line['price'],
            'lineTotal' => $lineTotal,
        ];
    }
    return [
        'id' => (int) $order['id'],
        'createdAt' => $order['created_at'],
        'items' => $mapped,
        'total' => $total,
    ];
}

function list_orders(int $userId): array
{
    $stmt = db()->prepare('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC');
    $stmt->execute([$userId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $orders = [];
    foreach ($ids as $id) {
        $orders[] = get_order($userId, (int) $id);
    }
    return $orders;
}

function slug_id(string $title): string
{
    $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-'));
    if ($slug === '') {
        $slug = 'product';
    }
    return substr($slug, 0, 40) . '-' . substr(uniqid(), -4);
}

function create_product(array $body): array
{
    $id = slug_id((string) ($body['title'] ?? 'product'));
    $stmt = db()->prepare(
        'INSERT INTO products (id, title, category, price, old_price, image, badge, bestseller, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        trim((string) ($body['title'] ?? '')),
        trim((string) ($body['category'] ?? 'Dress')),
        (float) ($body['price'] ?? 0),
        isset($body['oldPrice']) ? (float) $body['oldPrice'] : null,
        trim((string) ($body['image'] ?? '/assets/images/product-green-dress.jpg')),
        $body['badge'] ?? null,
        !empty($body['bestseller']) ? 1 : 0,
        trim((string) ($body['description'] ?? '')),
    ]);
    return find_product($id);
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
