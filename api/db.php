<?php
declare(strict_types=1);

/**
 * @return array{host:string,port:int,name:string,user:string,pass:string,charset:string}
 */
function senai_db_config(): array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        throw new RuntimeException(
            'Configure o MySQL: copie api/config.example.php para api/config.php e defina host, base, usuário e senha.'
        );
    }
    /** @var array $c */
    $c = require $path;

    return [
        'host' => (string) ($c['host'] ?? '127.0.0.1'),
        'port' => (int) ($c['port'] ?? 3306),
        'name' => (string) ($c['name'] ?? ''),
        'user' => (string) ($c['user'] ?? ''),
        'pass' => (string) ($c['pass'] ?? ''),
        'charset' => (string) ($c['charset'] ?? 'utf8mb4'),
    ];
}

function senai_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = senai_db_config();
    if ($c['name'] === '') {
        throw new RuntimeException('Em api/config.php defina o nome da base (name).');
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $c['host'],
        $c['port'],
        $c['name'],
        $c['charset']
    );
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}
