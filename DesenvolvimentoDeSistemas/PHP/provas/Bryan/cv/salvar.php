<?php
include ("conexao.php");
$nome = $_POST['nome'];
$preco = $_POST['preco'];
$codigo_barras = $_POST['codigo_barras'];
$marca = $_POST['marca'];
$categoria = $_POST['categoria'];
$matricula = $_POST['matricula'];
$sql = "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria, matricula) VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria', '$matricula')";
$conexao->query($sql);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <header>
        <h1>Produto cadastrado com sucesso!</h1>
        <nav>
            <a href="index.html">Voltar para o formulário</a>
        </nav>
    </header>
</body>
</html>