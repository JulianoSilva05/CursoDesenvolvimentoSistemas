<?php
include ("conexao.php");
$nome = $_POST['nome'];
$preco = $_POST['preco'];
$codigo_barras = $_POST['codigo_barras'];
$marca = $_POST['marca'];
$categoria = $_POST['categoria'];
$matricula = $_POST['matricula'];

//inserir dadis
$sql = "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria, matricula) VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria', '$matricula')";

$conexao -> query($sql);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Prova PHP</title>
</head>
<body>
    <header>
        <h1>Produto salvo com sucesso!</h1>
        <h2>Deseja cadastrar outro produto?</h2>
        <nav>
            <a href="index.html">Inicio</a>
        </nav>
    </header>
    <footer>
        <p>Desenvolvido por: Matheus Vieira</p>
    </footer>
</body>
</html>