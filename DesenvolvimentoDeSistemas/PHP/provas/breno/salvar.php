<?php

include("conexao.php");

$nome = $_POST["nome"];
$preco = $_POST["preco"];
$codigo_barras = $_POST["codigo_barras"];
$marca = $_POST["marca"];
$categoria = $_POST["categoria"];
$matricula = $_POST["matricula"];


if ($nome != "bola de futebol" && $preco != "300,00" && $codigo_barras != "34566354" && $marca != "Adidas" && $categoria != "Espostes") 

    $sql = "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria)
            VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria')";

    $resultado = new mysqli($conexao, $sql);

   
?>