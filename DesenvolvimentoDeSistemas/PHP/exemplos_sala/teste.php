<?php
$opcao = $_POST["turno"];

echo "O turno escolhido foi ".$opcao;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <form action="#" method="post">
    <select name="horario" id="">
        <option value="manha" name="turno">Manhã</option>
        <option value="tarde" name="turno">Tarde</option>
    </select>
    <input type="submit" value="ENVIAR">
    </form>
</body>
</html>