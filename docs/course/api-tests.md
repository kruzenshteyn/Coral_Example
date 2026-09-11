# Проверка API (любой из трёх серверов)

Полный алгоритм выполненного тестирования и пошаговая инструкция: [TESTING.md](../../stage-06-server/TESTING.md).

Подставьте порт: PHP `8000`, Django `8001`, Node `8002`.

```
curl http://localhost:8000/api/products
```

```
curl -c cookies.txt -H "Content-Type: application/json" -d "{\"name\":\"Ada\",\"email\":\"ada@example.com\",\"password\":\"secret1\"}" http://localhost:8000/api/auth/register
```

```
curl -b cookies.txt http://localhost:8000/api/me
```

```
curl -b cookies.txt -c cookies.txt -H "Content-Type: application/json" -d "{\"productId\":\"green-dress\"}" http://localhost:8000/api/orders
```

```
curl -b cookies.txt http://localhost:8000/api/orders
```

Ожидание: `{"ok":true,...}`, пароль в JSON не появляется.
