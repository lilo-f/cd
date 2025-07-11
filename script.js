// URL base da API - ajuste conforme sua estrutura
const API_URL = 'http://localhost/SiteRaven/backend/api.php';

// Função para cadastrar usuário
async function cadastrarUsuario(event) {
    event.preventDefault();
    
    const usuario = {
        nome: document.getElementById('nome').value,
        sobrenome: document.getElementById('sobrenome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        cpf: document.getElementById('cpf').value,
        senha: document.getElementById('senha').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            alert('Cadastro realizado com sucesso!');
            // Redirecionar ou limpar formulário
            window.location.href = 'login.html';
        } else {
            alert('Erro: ' + (resultado.error || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Falha na conexão com o servidor');
        console.error(error);
    }
}

// Função para login
async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
        const usuario = await response.json();
        
        if (usuario.error) {
            alert(usuario.error);
            return;
        }
        
        // Verificar senha (simplificado - na prática use bcrypt)
        if (usuario.senha_hash) {
            alert(`Bem-vindo, ${usuario.nome}!`);
            // Salvar token/session (para exemplo usaremos localStorage)
            localStorage.setItem('usuarioLogado', JSON.stringify({
                id: usuario.id,
                nome: usuario.nome
            }));
            window.location.href = 'perfil.html';
        } else {
            alert('Credenciais inválidas!');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor');
    }
}