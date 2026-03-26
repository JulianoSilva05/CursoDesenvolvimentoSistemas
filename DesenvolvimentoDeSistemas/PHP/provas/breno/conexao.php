<?php

$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "produtos";

$conexao = mysqli_connect($servidor, $usuario, $senha, $banco);

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
} else {
    echo "Conectado com sucesso!";
}

?>