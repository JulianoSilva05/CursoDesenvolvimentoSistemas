<?php

include 'conexao.php';

$nome = $_POST['nome'];
$preco = $_POST['preco'];
$codigo_barras = $_POST['codigo_barras'];
$marca = $_POST['marca'];
$categoria = $_POST['categoria'];


$sql = "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria)
VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria')";



?>