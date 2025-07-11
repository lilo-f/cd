<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "site_tatuagem";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Erro de conexão: ' . $conexao->connect_error
    ]));
}
?>