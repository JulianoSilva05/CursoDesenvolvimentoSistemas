<?php

$servidor = "192.168.206.43";
$usuario = "pessoa";
$senha = "pessoa";
$banco = "produtos";

$conexao = mysqli_connect($servidor, $usuario, $senha, $banco);

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
}

?>