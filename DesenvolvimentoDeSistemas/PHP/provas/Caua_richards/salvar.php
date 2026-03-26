<?php
$nome =         $_POST['nome'];
$preco =        $_POST['preco'];
$codigo_de_barras =    $_POST['codigo_de_barras'];
$marca =        $_POST['marca'];
$categoria =    $_POST['categoria'];
$sql =   "INSERT INTO  produtos (nome, preco, codigo_de_barras, marca, categoria)    VALUES ('$nome', '$preco', '$codigo_de_barras', '$marca', '$categoria')";
$conexao    ->query($sql);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content ="width=device-width,   initial-scale=1.0">
    <title>Prova</title>   
</head>
<header>
    <h1>Produtos</h1>
    <nav>
         <a href="index.html">Home</a>
    </nav>
</header>
<body>
    <h2>Produto Salvo</h2>
    <p>Nome: <?php echo $nome; ?></p>
    <p>Preço: <?php echo $preco; ?></p>
    <p>Código de Barras: <?php echo $codigo_de_barras; ?></p>
    <p>Marca:  <?php echo $marca; ?></p>
    <p>Categoria:   <?php echo $categoria; ?></p>
</body>
</html>