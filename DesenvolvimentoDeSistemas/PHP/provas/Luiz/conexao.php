<?php
$servidor = "192.168.206.43";
$usuario = "pessoa";
$senha = "pessoa";
$banco = "produtos";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die("Falha na conexão: " . $conexao->connect_error);
}
?>