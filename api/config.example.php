<?php
/**
 * Copie este arquivo para config.php e ajuste credenciais.
 * config.php não deve ser versionado (veja .gitignore).
 */
declare(strict_types=1);

return [
    'host' => getenv('SENAI_DB_HOST') ?: '127.0.0.1',
    'port' => (int) (getenv('SENAI_DB_PORT') ?: 3306),
    'name' => getenv('SENAI_DB_NAME') ?: 'senai_curso',
    'user' => getenv('SENAI_DB_USER') ?: 'root',
    'pass' => getenv('SENAI_DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
