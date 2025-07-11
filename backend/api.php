<?php
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "site_tatuagem";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die("Conexão falhou: " . $conexao->connect_error);
}
?>