
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <?php
    $nome=$_POST['nome'];
    $preco=$_POST['preco'];
    $codigo_barras=$_POST['codigo_barras'];
    $marca=$_POST['marca'];
    $categoria=$_POST['categoria'];
    $matricula=$_POST['matricula'];
    include "conexao.php";
    $sql= "INSERT INTO produtos (nome, preco, codigo_barras, marca, categoria, matricula) 
    VALUES ('$nome', '$preco', '$codigo_barras', '$marca', '$categoria', '$matricula')";
    $conexao->query($sql);
    echo "Produto cadastrado com sucesso!";
    ?>
</body>
</html>