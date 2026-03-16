// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar token e usuário logado
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Se não tiver token, redirecionar para login
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Exibir nome do usuário
    document.getElementById('userName').textContent = user.nome || 'Usuário';
    
    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
    
    // Função para navegação (será expandida conforme páginas forem criadas)
    window.navigateTo = function(page) {
        switch(page) {
            case 'retirada':
                alert('Página de Retirada de EPI em desenvolvimento');
                break;
            case 'colaboradores':
                window.location.href = '/cadastro-colaboradores.html';
                break;
            case 'epis':
                window.location.href = '/cadastro-epis.html';
                break;
            case 'comprovantes':
                alert('Página de Consulta de Comprovantes em desenvolvimento');
                break;
            case 'logs':
                window.location.href = '/logs.html';
                break;
            case 'relatorios':
                alert('Página de Relatórios em desenvolvimento');
                break;
            default:
                alert('Funcionalidade em desenvolvimento');
        }
    };
    
    // Verificar se usuário é admin (opcional - para futuras expansões)
    if (user.isAdmin) {
        document.body.classList.add('admin-user');
    } else {
        document.body.classList.add('regular-user');
        // Ocultar cards administrativos se necessário
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
});