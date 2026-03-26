<?php
$storage = __DIR__ . "/produtos.json";

if (file_exists($storage)) {
    $conteudo = file_get_contents($storage);
    $produtos = json_decode($conteudo, true);
} else {
    $produtos = [];
}

if (!is_array($produtos)) {
    $produtos = [];
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST["id"] ?? "";
    $nome = $_POST["nome"] ?? "";
    $preco = $_POST["preco"] ?? "";
    $codigo_barras = $_POST["codigo_barras"] ?? "";
    $marca = $_POST["marca"] ?? "";
    $categoria = $_POST["categoria"] ?? "";

    $produto = [
        "id" => $id,
        "nome" => $nome,
        "preco" => $preco,
        "codigo_barras" => $codigo_barras,
        "marca" => $marca,
        "categoria" => $categoria
    ];

    $produtos[] = $produto;

    file_put_contents(
        $storage,
        json_encode($produtos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Produtos Cadastrados</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <header class="cabecalho">
        <h1>Produtos Cadastrados</h1>
        <p>Listagem dos dados salvos no arquivo JSON</p>
    </header>
    <main class="container-principal">
        <section class="listagem-box">
            <h2>Lista de Produtos</h2>
            <ul class="cards">
                <?php foreach ($produtos as $p): ?>
                    <li class="card">
                        <article>
                            <h3><?php echo htmlspecialchars($p["nome"] ?? ""); ?></h3>
                            <dl>
                                <dt>ID</dt>
                                <dd><?php echo htmlspecialchars($p["id"] ?? ""); ?></dd>
                                <dt>Preco</dt>
                                <dd>R$ <?php echo htmlspecialchars($p["preco"] ?? ""); ?></dd>
                                <dt>Codigo de Barras</dt>
                                <dd><?php echo htmlspecialchars($p["codigo_barras"] ?? ""); ?></dd>
                                <dt>Marca</dt>
                                <dd><?php echo htmlspecialchars($p["marca"] ?? ""); ?></dd>
                                <dt>Categoria</dt>
                                <dd><?php echo htmlspecialchars($p["categoria"] ?? ""); ?></dd>
                            </dl>
                        </article>
                    </li>
                <?php endforeach; ?>
            </ul>
            <p class="total">Total de produtos: <?php echo count($produtos); ?></p>
            <div class="acao">
                <a href="index.html" class="botao-voltar">Voltar para o formulario</a>
            </div>
        </section>
    </main>
    <footer class="rodape">
        <p>Exemplo de PHP com JSON sem banco de dados</p>
    </footer>
</body>

</html>
