<?php
// Exemplo super simples para iniciantes.
$produtos = [];
$produtosCadastrados = [];

if (!empty($_POST['id'])) {
    $produto = [
        'id' => $_POST['id'],
        'nome' => $_POST['nome'] ?? '',
        'preco' => $_POST['preco'] ?? '',
        'codigo_barras' => $_POST['codigo_barras'] ?? '',
        'marca' => $_POST['marca'] ?? '',
        'categoria' => $_POST['categoria'] ?? ''
    ];

    $produtos[] = $produto;
    $produtosCadastrados[] = $produto;
}

// Exibição na tela
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Produtos Salvos</title>
    <style>
        body {font-family: Arial, sans-serif; padding: 1rem; background: #f8faff;}
        .box {max-width: 980px; margin: auto; background: #fff; border: 1px solid #ccc; padding: 1rem;}
        table{width:100%; border-collapse:collapse;}
        th,td{padding:.6rem;border:1px solid #ccc;text-align:left;}
        th{background:#eee;}
        .nota{margin: .8rem 0; color:#555;}
    </style>
</head>
<body>
    <div class="box">
        <h1>Cadastro de Produto</h1>
        <form action="" method="post">
            <div class="form-row"><label for="id">ID</label><input type="text" id="id" name="id" required></div>
            <div class="form-row"><label for="nome">Nome</label><input type="text" id="nome" name="nome"></div>
            <div class="form-row"><label for="preco">Preço</label><input type="text" id="preco" name="preco"></div>
            <div class="form-row"><label for="codigo_barras">Código de Barras</label><input type="text" id="codigo_barras" name="codigo_barras"></div>
            <div class="form-row"><label for="marca">Marca</label><input type="text" id="marca" name="marca"></div>
            <div class="form-row"><label for="categoria">Categoria</label><input type="text" id="categoria" name="categoria"></div>
            <button type="submit">Cadastrar</button>
        </form>

        <?php if (empty($produtosCadastrados)): ?>
            <p>Nenhum produto cadastrado ainda.</p>
        <?php else: ?>
            <h2>Produtos cadastrados</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Código de Barras</th>
                        <th>Marca</th>
                        <th>Categoria</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($produtosCadastrados as $p): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($p['id'], ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($p['nome'], ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($p['preco'], ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($p['codigo_barras'], ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($p['marca'], ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($p['categoria'], ENT_QUOTES, 'UTF-8'); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <p>Total: <?php echo count($produtosCadastrados); ?> produtos.</p>
        <?php endif; ?>
    </div>
</body>
</html>
