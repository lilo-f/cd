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

// Validação dos campos
$camposObrigatorios = ['nome', 'email', 'senha', 'telefone', 'cpf'];
foreach ($camposObrigatorios as $campo) {
    if (empty($dados[$campo])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => "O campo $campo é obrigatório"]));
    }
}

// Verificar se e-mail já existe
$stmt = $conexao->prepare("SELECT id FROM cadastro WHERE email = ?");
$stmt->bind_param("s", $dados['email']);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'E-mail já cadastrado']));
}

// Hash da senha
$senhaHash = password_hash($dados['senha'], PASSWORD_DEFAULT);

// Inserir novo usuário
$stmt = $conexao->prepare("INSERT INTO cadastro (nome, sobrenome, email, telefone, cpf, senha_hash) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", 
    $dados['nome'],
    $dados['sobrenome'],
    $dados['email'],
    $dados['telefone'],
    $dados['cpf'],
    $senhaHash
);

if ($stmt->execute()) {
    $usuario_id = $conexao->insert_id;
    
    // Obter dados do usuário criado
    $stmt = $conexao->prepare("SELECT id, nome, sobrenome, email FROM cadastro WHERE id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'user' => $usuario,
        'message' => 'Usuário cadastrado com sucesso'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar usuário']);
}

$conexao->close();
?>