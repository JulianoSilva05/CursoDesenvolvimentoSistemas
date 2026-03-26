<?php
include 'conexao.php';

if ($conexao->connect_error) {
    echo "Erro de conexão: " . $conexao->connect_error;
} else {
    echo "Conexão bem-sucedida!";
}

$conexao->close();
?>