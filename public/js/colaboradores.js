const token = localStorage.getItem('token');
// public/js/colaboradores.js
document.addEventListener('DOMContentLoaded', function () {
    
    // Verificar token e usuário logado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Se não tiver token, redirecionar para login
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Exibir nome do usuário
    document.getElementById('userName').textContent = user.nome || 'Usuário';

    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Configurar formulário de cadastro
    const colaboradorForm = document.getElementById('colaboradorForm');
    colaboradorForm.addEventListener('submit', function (e) {
        e.preventDefault();
        salvarColaborador();
    });

    // Configurar busca
    document.getElementById('buscaColaborador').addEventListener('input', function () {
        filtrarColaboradores(this.value);
    });

    // Configurar botão de salvar edição
    document.getElementById('salvarEdicaoBtn').addEventListener('click', salvarEdicao);

    // Configurar botão de confirmar demissão
    document.getElementById('confirmarDemissaoBtn').addEventListener('click', confirmarDemissao);

    // Carregar lista de colaboradores
    carregarColaboradores();

    // Formatar CPF
    document.getElementById('cpf').addEventListener('input', formatarCPF);
    document.getElementById('editarCpf').addEventListener('input', formatarCPF);
});

// Variáveis globais
let colaboradores = [];
let colaboradorParaDemitir = null;
let paginaAtual = 1;
const itensPorPagina = 10;

// Função para formatar CPF
function formatarCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    e.target.value = value;
}

// Função para salvar colaborador
async function salvarColaborador() {
    const btn = document.getElementById('salvarBtn');
    const spinner = document.getElementById('salvarSpinner');
    const texto = document.getElementById('salvarTexto');

    // Obter dados do formulário
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        matricula: document.getElementById('matricula').value.trim(),
        setor: document.getElementById('setor').value,
        status: document.getElementById('status').value,
    };

    // Validação básica
    if (!dados.nome || !dados.cpf || !dados.matricula || !dados.setor) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    // Validar CPF
    if (dados.cpf.length !== 11) {
        mostrarMensagem('CPF inválido. Deve conter 11 dígitos.', 'danger');
        return;
    }

    // Mostrar loading
    spinner.classList.remove('d-none');
    texto.innerHTML = '<i class="bi bi-save me-1"></i> Salvando...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/funcionarios', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao salvar colaborador');

        // Adicionar colaborador à lista local (simulação)
        const novoColaborador = {
            id: Date.now(), // ID temporário para simulação
            ...dados,
            cpf: document.getElementById('cpf').value // CPF formatado
        };
        colaboradores.unshift(novoColaborador);

        mostrarMensagem('Colaborador salvo com sucesso!', 'success');
        colaboradorForm.reset();
        carregarColaboradores(); // Recarregar lista

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao salvar colaborador. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-save me-1"></i> Salvar Colaborador';
        btn.disabled = false;
    }
}

// Função para carregar colaboradores
async function carregarColaboradores() {
    const tbody = document.getElementById('colaboradoresTableBody');

    // Mostrar loading
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        try {
            const response = await fetch("/api/funcionarios", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            colaboradores = data;
        } catch (err) {
            console.error('Erro:', err);
        }

        renderizarLista();

    } catch (error) {
        console.error('Erro:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Erro ao carregar colaboradores
                </td>
            </tr>
        `;
    }
}

// Função para renderizar a lista de colaboradores
function renderizarLista(filtro = '') {
    const tbody = document.getElementById('colaboradoresTableBody');
    const startIndex = (paginaAtual - 1) * itensPorPagina;
    const endIndex = startIndex + itensPorPagina;

    // Filtrar colaboradores se necessário
    let colaboradoresFiltrados = colaboradores;
    if (filtro) {
        const termo = filtro.toLowerCase();
        colaboradoresFiltrados = colaboradores.filter(c =>
            c.nome.toLowerCase().includes(termo) ||
            c.cpf.includes(termo) ||
            c.matricula.toLowerCase().includes(termo)
        );
    }

    const colaboradoresPagina = colaboradoresFiltrados.slice(startIndex, endIndex);

    if (colaboradoresPagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="bi bi-person-x me-1"></i>
                    Nenhum colaborador encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = colaboradoresPagina.map(colaborador => `
        <tr class="${colaborador.status === 'desligado' ? 'table-secondary' : ''}">
            <td>${colaborador.nome}</td>
            <td>${colaborador.cpf}</td>
            <td>${colaborador.matricula}</td>
            <td>${colaborador.setor}</td>
            <td>
                <span class="badge ${colaborador.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                    ${colaborador.status === 'ativo' ? 'Ativo' : 'Desligado'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" title="Editar" 
                            onclick='prepararEdicao(${JSON.stringify(colaborador).replace(/'/g, "\\'")})'>
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${colaborador.status === 'ativo' ?
            `<button type="button" class="btn btn-outline-warning" title="Demitir" 
                                onclick="prepararDemissao(${colaborador.id}, '${colaborador.nome}', '${colaborador.matricula}')">
                            <i class="bi bi-person-x"></i>
                        </button>` :
            `<button type="button" class="btn btn-outline-success" title="Reativar" 
                                onclick="reativarColaborador(${colaborador.id})">
                            <i class="bi bi-person-check"></i>
                        </button>`
        }
                </div>
            </td>
        </tr>
    `).join('');

    // Renderizar paginação
    renderizarPaginacao(colaboradoresFiltrados.length);
}

// Função para filtrar colaboradores
function filtrarColaboradores(termo) {
    paginaAtual = 1; // Resetar para primeira página
    renderizarLista(termo);
}

// Função para renderizar paginação
function renderizarPaginacao(totalItens) {
    const totalPages = Math.ceil(totalItens / itensPorPagina);
    const pagination = document.getElementById('paginacao');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Botão anterior
    html += `
        <li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual - 1})">Anterior</a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === paginaAtual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="mudarPagina(${i})">${i}</a>
            </li>
        `;
    }

    // Botão próximo
    html += `
        <li class="page-item ${paginaAtual === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual + 1})">Próximo</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Função para mudar página
function mudarPagina(numero) {
    const totalPages = Math.ceil(colaboradores.length / itensPorPagina);
    if (numero >= 1 && numero <= totalPages) {
        paginaAtual = numero;
        const filtro = document.getElementById('buscaColaborador').value;
        renderizarLista(filtro);
    }
}

// Função para preparar edição de colaborador
function prepararEdicao(colaborador) {
    // Preencher formulário do modal com dados do colaborador
    document.getElementById('editarId').value = colaborador.id;
    document.getElementById('editarNome').value = colaborador.nome;
    document.getElementById('editarCpf').value = colaborador.cpf;
    document.getElementById('editarMatricula').value = colaborador.matricula;
    document.getElementById('editarSetor').value = colaborador.setor;
    document.getElementById('editarStatus').value = colaborador.status;
    document.getElementById('editarDataAdmissao').value = colaborador.dataAdmissao || '';

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarModal'));
    modal.show();
}

// Função para salvar edição
async function salvarEdicao() {
    const btn = document.getElementById('salvarEdicaoBtn');
    const spinner = document.getElementById('edicaoSpinner');
    const texto = document.getElementById('edicaoTexto');

    // Obter dados do formulário
    const dados = {
        id: parseInt(document.getElementById('editarId').value),
        nome: document.getElementById('editarNome').value.trim(),
        cpf: document.getElementById('editarCpf').value.replace(/\D/g, ''),
        matricula: document.getElementById('editarMatricula').value.trim(),
        setor: document.getElementById('editarSetor').value,
        status: document.getElementById('editarStatus').value,
    };

    // Validação básica
    if (!dados.nome || !dados.cpf || !dados.matricula || !dados.setor) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    // Mostrar loading
    spinner.classList.remove('d-none');
    texto.innerHTML = '<i class="bi bi-save me-1"></i> Salvando...';
    btn.disabled = true;

    try {

        const response = await fetch(`/api/funcionarios/${dados.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar colaborador');

        // Atualizar dados localmente
        const index = colaboradores.findIndex(c => c.id === dados.id);
        if (index !== -1) {
            colaboradores[index] = {
                ...colaboradores[index],
                nome: dados.nome,
                setor: dados.setor,
                status: dados.status,
                dataAdmissao: dados.dataAdmissao
            };
        }

        mostrarMensagem('Colaborador atualizado com sucesso!', 'success');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
        modal.hide();

        // Recarregar lista
        const filtro = document.getElementById('buscaColaborador').value;
        renderizarLista(filtro);

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao atualizar colaborador. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-save me-1"></i> Salvar Alterações';
        btn.disabled = false;
    }
}

// Função para preparar demissão
function prepararDemissao(id, nome, matricula) {
    colaboradorParaDemitir = { id, nome, matricula };
    document.getElementById('nomeColaboradorDemissao').textContent = nome;
    document.getElementById('matriculaColaboradorDemissao').textContent = matricula;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('demitirModal'));
    modal.show();
}

// Função para confirmar demissão
async function confirmarDemissao() {
    if (!colaboradorParaDemitir) return;

    const btn = document.getElementById('confirmarDemissaoBtn');
    const spinner = document.getElementById('demissaoSpinner');
    const texto = document.getElementById('demissaoTexto');

    // Mostrar loading
    spinner.classList.remove('d-none');
    texto.innerHTML = 'Processando...';
    btn.disabled = true;

    try {

        const response = await fetch(`/api/funcionarios/${colaboradorParaDemitir.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Erro ao demitir colaborador');

        // Atualizar status localmente
        const index = colaboradores.findIndex(c => c.id === colaboradorParaDemitir.id);
        if (index !== -1) {
            colaboradores[index].status = 'desligado';
        }

        mostrarMensagem(`Colaborador ${colaboradorParaDemitir.nome} demitido com sucesso!`, 'success');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('demitirModal'));
        modal.hide();

        // Recarregar lista
        const filtro = document.getElementById('buscaColaborador').value;
        renderizarLista(filtro);

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao demitir colaborador. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-person-x me-1"></i> Confirmar Demissão';
        btn.disabled = false;
        colaboradorParaDemitir = null;
    }
}

// Função para reativar colaborador
async function reativarColaborador(id) {
    if (!confirm('Tem certeza que deseja reativar este colaborador?')) {
        return;
    }

    try {
    
        const response = await fetch(`/api/funcionarios/${id}/reactivate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Erro ao reativar colaborador');

        // Atualizar status localmente
        const index = colaboradores.findIndex(c => c.id === id);
        if (index !== -1) {
            colaboradores[index].status = 'ativo';
        }

        mostrarMensagem('Colaborador reativado com sucesso!', 'success');

        // Recarregar lista
        const filtro = document.getElementById('buscaColaborador').value;
        renderizarLista(filtro);

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao reativar colaborador. Tente novamente.', 'danger');
    }
}

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo = 'info') {
    // Remover mensagens anteriores
    const mensagensExistentes = document.querySelectorAll('.alert-temp');
    mensagensExistentes.forEach(el => el.remove());

    // Criar nova mensagem
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-temp position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <i class="bi ${tipo === 'success' ? 'bi-check-circle' :
            tipo === 'danger' ? 'bi-exclamation-triangle' :
                'bi-info-circle'} me-1"></i>
        ${mensagem}
    `;

    document.body.appendChild(alertDiv);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}