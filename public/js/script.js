// public/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');
    const messageAlert = document.getElementById('messageAlert');
    
    // Função para mostrar mensagem
    function showMessage(message, isSuccess = true) {
        messageAlert.classList.remove('d-none', 'alert-success', 'alert-danger');
        messageAlert.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        messageAlert.innerHTML = message;
        
        // Scroll para a mensagem
        messageAlert.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Função para mostrar loading
    function showLoading(show) {
        if (show) {
            loginSpinner.classList.remove('d-none');
            loginText.textContent = 'Autenticando...';
            loginBtn.disabled = true;
        } else {
            loginSpinner.classList.add('d-none');
            loginText.textContent = 'Entrar';
            loginBtn.disabled = false;
        }
    }
    
    // Função para fazer login
    async function loginUser(matricula, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matricula, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Login realizado com sucesso! Redirecionando...', true);
                
                // Salvar token no localStorage (ou sessionStorage)
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirecionar para dashboard (criar depois)
                setTimeout(() => {
                    window.location.href = '/dashboard.html'; // ou outra página
                }, 1500);
            } else {
                showMessage(data.message || 'Erro ao fazer login. Verifique suas credenciais.', false);
            }
        } catch (error) {
            console.error('Erro:', error);
            showMessage('Erro de conexão. Tente novamente mais tarde.', false);
        }
    }
    
    // Evento de submit do formulário
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const matricula = document.getElementById('matricula').value.trim();
        const password = document.getElementById('password').value;
        
        if (!matricula || !password) {
            showMessage('Por favor, preencha todos os campos.', false);
            return;
        }
        
        showLoading(true);
        await loginUser(matricula, password);
        showLoading(false);
    });
    
    // Verificar se usuário já está logado
    if (localStorage.getItem('token')) {
        if (data.user.isAdmin) {
            window.location.href = '/dashboard.html';
        } else {
            // Para usuários não administradores, podemos criar uma dashboard diferente
            window.location.href = '/user-dashboard.html'; // ou a mesma dashboard com menos opções
        }
    }
});