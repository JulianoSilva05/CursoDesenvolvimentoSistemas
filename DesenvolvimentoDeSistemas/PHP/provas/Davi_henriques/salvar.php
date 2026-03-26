<?php
include 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $matricula = $_POST['matricula'];
    $nome = $_POST['nome'];
    $preco = $_POST['preco'];
    $codigo_barras = $_POST['codigo_barras'];
    $marca = $_POST['marca'];
    $categoria = $_POST['categoria'];

    $sql = "INSERT INTO produtos (matricula, nome, preco, codigo_barras, marca, categoria) VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ssdsss", $matricula, $nome, $preco, $codigo_barras, $marca, $categoria);
 
    if ($stmt->execute()) {
        echo "<h2>Produto cadastrado com sucesso!</h2>";
        echo "<table border='1'>";
        echo "<tr><th>Matrícula</th><th>Nome</th><th>Preço</th><th>Código de Barras</th><th>Marca</th><th>Categoria</th></tr>";
        echo "<tr>";
        echo "<td>" . htmlspecialchars($matricula) . "</td>";
        echo "<td>" . htmlspecialchars($nome) . "</td>";
        echo "<td>" . htmlspecialchars($preco) . "</td>";
        echo "<td>" . htmlspecialchars($codigo_barras) . "</td>";
        echo "<td>" . htmlspecialchars($marca) . "</td>";
        echo "<td>" . htmlspecialchars($categoria) . "</td>";
        echo "</tr>";
        echo "</table>";
    } else {
        echo "Erro ao cadastrar produto: " . $stmt->error;
    }

    $stmt->close();
}

$conexao->close();
?>