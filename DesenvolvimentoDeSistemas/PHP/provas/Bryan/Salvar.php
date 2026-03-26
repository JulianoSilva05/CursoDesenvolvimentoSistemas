<?php

include("conexao.php");


$nome = $_POST['nome'];
$preco = $_POST['preco'];
$codigo_barras = $_POST['codigo_barras'];
$marca = $_POST['marca'];
$categoria = $_POST['categoria'];
$matricula = $_POST['matricula'];


$sql = "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria, matricula)
VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria', '$matricula')";


if (mysqli_query($conexao, $sql)) {
    echo "Produto cadastrado com sucesso!";
} else {
    echo "Erro: " . mysqli_error($conexao);
}

mysqli_close($conexao);

?>