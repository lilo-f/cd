<?php
// Configurações CORS
header("Access-Control-Allow-Origin: http://127.0.0.1:5501");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// Responder para requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexão com o banco de dados
$conexao = new mysqli("localhost", "root", "", "site_tatuagem");

if ($conexao->connect_error) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Erro de conexão com o banco']));
}

// Obter dados da requisição
$json = file_get_contents('php://input');
$dados = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Dados inválidos']));
}

// Validação
if (empty($dados['email']) || empty($dados['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'E-mail e senha são obrigatórios']));
}

// Buscar usuário
$stmt = $conexao->prepare("SELECT id, nome, sobrenome, email, senha_hash FROM cadastro WHERE email = ?");
$stmt->bind_param("s", $dados['email']);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Credenciais inválidas']));
}

$usuario = $resultado->fetch_assoc();

// Verificar senha
if (password_verify($dados['password'], $usuario['senha_hash'])) {
    // Login bem-sucedido
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'] . ' ' . $usuario['sobrenome'],
            'email' => $usuario['email']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
}

$conexao->close();
?>