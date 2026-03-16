// =============================================
// CONFIGURAÇÃO GLOBAL
// =============================================
const API_BASE = '/api';
let token = localStorage.getItem('token');
let epis = [];
let epiParaExcluir = null;
let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;
const IMG_PLACEHOLDER = 'https://placehold.co/60x60/e9ecef/6c757d?text=EPI';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (!token) {
        window.location.href = '/';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.nome || 'Usuário';

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/';
    });

    // Form de cadastro
    document.getElementById('epiForm').addEventListener('submit', e => {
        e.preventDefault();
        salvarEpi();
    });

    // Limpar form
    document.getElementById('limparBtn').addEventListener('click', () => {
        resetarUpload();
    });

    // Upload - cadastro
    configurarUpload('uploadArea', 'imagemUpload', 'uploadPlaceholder', 'uploadPreview', 'previewImg');

    // Remover imagem no cadastro
    document.getElementById('removerImagem').addEventListener('click', () => {
        resetarUpload();
    });

    // Upload - edição (clique na imagem atual para trocar)
    document.getElementById('editarPreviewImg').addEventListener('click', () => {
        document.getElementById('editarImagemUpload').click();
    });
    configurarUpload('editarUploadArea', 'editarImagemUpload', 'editarUploadPlaceholder', 'editarUploadPreview', 'editarPreviewImg', true);

    // Busca
    document.getElementById('buscaEpi').addEventListener('input', e => {
        paginaAtual = 1;
        renderizarLista(e.target.value);
    });

    // Botões dos modais
    document.getElementById('salvarEdicaoBtn').addEventListener('click', salvarEdicao);
    document.getElementById('confirmarExclusaoBtn').addEventListener('click', confirmarExclusao);

    // Carregar lista ao abrir aba
    document.getElementById('lista-tab').addEventListener('shown.bs.tab', () => {
        carregarEpis();
    });
});

// =============================================
// UPLOAD DE IMAGEM
// =============================================
function configurarUpload(areaId, inputId, placeholderId, previewId, imgId, isEdit = false) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);

    // Clique na área (exceto edição que usa clique na imagem)
    if (!isEdit) {
        area.addEventListener('click', () => input.click());
    }

    // Drag & Drop
    area.addEventListener('dragover', e => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) processarArquivo(file, placeholderId, previewId, imgId, input);
    });

    // Seleção via input
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (file) processarArquivo(file, placeholderId, previewId, imgId, input);
    });
}

function processarArquivo(file, placeholderId, previewId, imgId, input) {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        mostrarMensagem('Apenas arquivos de imagem são permitidos.', 'danger');
        return;
    }
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
        mostrarMensagem('A imagem deve ter no máximo 5MB.', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(imgId).src = e.target.result;
        document.getElementById(placeholderId).classList.add('d-none');
        document.getElementById(previewId).classList.remove('d-none');
    };
    reader.readAsDataURL(file);
}

function resetarUpload() {
    document.getElementById('imagemUpload').value = '';
    document.getElementById('previewImg').src = '';
    document.getElementById('uploadPlaceholder').classList.remove('d-none');
    document.getElementById('uploadPreview').classList.add('d-none');
}

// =============================================
// UPLOAD PARA O SERVIDOR
// =============================================
async function uploadImagem(inputId) {
    const input = document.getElementById(inputId);
    if (!input.files || !input.files[0]) return null;

    const formData = new FormData();
    formData.append('file', input.files[0]);

    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) throw new Error('Erro ao fazer upload da imagem');

    const data = await response.json();
    return data.url; // Ex: "/uploads/epis/nome-do-arquivo.jpg"
}

// =============================================
// CRUD - CRIAR EPI
// =============================================
async function salvarEpi() {
    const btn = document.getElementById('salvarBtn');
    const spinner = document.getElementById('salvarSpinner');
    const texto = document.getElementById('salvarTexto');

    const dados = {
        codigo: document.getElementById('codigo').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        ca: document.getElementById('ca').value.trim(),
        fabricante: document.getElementById('fabricante').value.trim(),
        tipo: document.getElementById('tipo').value,
        observacao: document.getElementById('observacao').value.trim()
    };

    if (!dados.codigo || !dados.descricao || !dados.fabricante || !dados.tipo) {
        mostrarMensagem('Preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    spinner.classList.remove('d-none');
    texto.innerHTML = 'Salvando...';
    btn.disabled = true;

    try {
        // 1. Fazer upload da imagem (se houver)
        const imagemUrl = await uploadImagem('imagemUpload');
        if (imagemUrl) dados.imagem = imagemUrl;

        // 2. Criar EPI na API
        const response = await fetch(`${API_BASE}/epis`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao salvar EPI');
        }

        mostrarMensagem('EPI cadastrado com sucesso!', 'success');
        document.getElementById('epiForm').reset();
        resetarUpload();

        // Ir para aba de lista e recarregar
        const listaTab = new bootstrap.Tab(document.getElementById('lista-tab'));
        listaTab.show();
        await carregarEpis();

    } catch (error) {
        mostrarMensagem(error.message || 'Erro ao salvar EPI.', 'danger');
    } finally {
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-save me-1"></i>Salvar EPI';
        btn.disabled = false;
    }
}

// =============================================
// CRUD - LISTAR EPIs
// =============================================
async function carregarEpis() {
    const tbody = document.getElementById('episTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="spinner-border text-success"></div>
            </td>
        </tr>`;

    try {
        const response = await fetch(`${API_BASE}/epis`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao carregar EPIs');

        epis = await response.json();
        renderizarLista();

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-1"></i>${error.message}
                </td>
            </tr>`;
    }
}

function renderizarLista(filtro = '') {
    const tbody = document.getElementById('episTableBody');

    let filtrados = epis;
    if (filtro) {
        const termo = filtro.toLowerCase();
        filtrados = epis.filter(e =>
            e.codigo?.toLowerCase().includes(termo) ||
            e.descricao?.toLowerCase().includes(termo) ||
            e.fabricante?.toLowerCase().includes(termo) ||
            e.tipo?.toLowerCase().includes(termo)
        );
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-shield-x me-1"></i>Nenhum EPI encontrado
                </td>
            </tr>`;
        document.getElementById('paginacao').innerHTML = '';
        return;
    }

    tbody.innerHTML = pagina.map(epi => `
        <tr>
            <td>
                <img src="${epi.imagem || IMG_PLACEHOLDER}"
                     alt="${epi.descricao}"
                     class="rounded epi-thumb"
                     style="width:52px;height:52px;object-fit:cover;cursor:pointer;"
                     onclick='visualizarEpi(${JSON.stringify(epi).replace(/'/g, "&#39;")})'
                     onerror="this.src='${IMG_PLACEHOLDER}'">
            </td>
            <td><span class="badge bg-secondary">${epi.codigo}</span></td>
            <td>${epi.descricao}</td>
            <td>${epi.ca || '<span class="text-muted">—</span>'}</td>
            <td>${epi.fabricante}</td>
            <td><span class="badge bg-info text-dark">${epi.tipo}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success" title="Visualizar"
                            onclick='visualizarEpi(${JSON.stringify(epi).replace(/'/g, "&#39;")})'>
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary" title="Editar"
                            onclick='prepararEdicao(${JSON.stringify(epi).replace(/'/g, "&#39;")})'>
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Excluir"
                            onclick='prepararExclusao(${JSON.stringify(epi).replace(/'/g, "&#39;")})'>
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderizarPaginacao(filtrados.length);
}

// =============================================
// CRUD - VISUALIZAR EPI
// =============================================
function visualizarEpi(epi) {
    document.getElementById('vizImg').src = epi.imagem || IMG_PLACEHOLDER;
    document.getElementById('vizImg').onerror = function() { this.src = IMG_PLACEHOLDER; };
    document.getElementById('vizDescricao').textContent = epi.descricao;
    document.getElementById('vizCodigo').textContent = epi.codigo;
    document.getElementById('vizCa').textContent = epi.ca || '—';
    document.getElementById('vizFabricante').textContent = epi.fabricante;
    document.getElementById('vizTipo').textContent = epi.tipo;

    const obsBox = document.getElementById('vizObservacaoBox');
    if (epi.observacao) {
        document.getElementById('vizObservacao').textContent = epi.observacao;
        obsBox.classList.remove('d-none');
    } else {
        obsBox.classList.add('d-none');
    }

    new bootstrap.Modal(document.getElementById('visualizarModal')).show();
}

// =============================================
// CRUD - EDITAR EPI
// =============================================
function prepararEdicao(epi) {
    document.getElementById('editarId').value = epi.id;
    document.getElementById('editarImagemAtual').value = epi.imagem || '';
    document.getElementById('editarCodigo').value = epi.codigo;
    document.getElementById('editarDescricao').value = epi.descricao;
    document.getElementById('editarCa').value = epi.ca || '';
    document.getElementById('editarFabricante').value = epi.fabricante;
    document.getElementById('editarTipo').value = epi.tipo;
    document.getElementById('editarObservacao').value = epi.observacao || '';

    // Mostrar imagem atual
    const imgEl = document.getElementById('editarPreviewImg');
    imgEl.src = epi.imagem || IMG_PLACEHOLDER;
    imgEl.onerror = function() { this.src = IMG_PLACEHOLDER; };
    document.getElementById('editarUploadPreview').classList.remove('d-none');
    document.getElementById('editarUploadPlaceholder').classList.add('d-none');
    document.getElementById('editarImagemUpload').value = '';

    new bootstrap.Modal(document.getElementById('editarModal')).show();
}

async function salvarEdicao() {
    const btn = document.getElementById('salvarEdicaoBtn');
    const spinner = document.getElementById('edicaoSpinner');
    const texto = document.getElementById('edicaoTexto');

    const id = document.getElementById('editarId').value;
    const dados = {
        codigo: document.getElementById('editarCodigo').value.trim(),
        descricao: document.getElementById('editarDescricao').value.trim(),
        ca: document.getElementById('editarCa').value.trim(),
        fabricante: document.getElementById('editarFabricante').value.trim(),
        tipo: document.getElementById('editarTipo').value,
        observacao: document.getElementById('editarObservacao').value.trim(),
        imagem: document.getElementById('editarImagemAtual').value
    };

    if (!dados.codigo || !dados.descricao || !dados.fabricante || !dados.tipo) {
        mostrarMensagem('Preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    spinner.classList.remove('d-none');
    texto.innerHTML = 'Salvando...';
    btn.disabled = true;

    try {
        // Upload nova imagem se selecionada
        const novaImagem = await uploadImagem('editarImagemUpload');
        if (novaImagem) dados.imagem = novaImagem;

        const response = await fetch(`${API_BASE}/epis/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao atualizar EPI');
        }

        mostrarMensagem('EPI atualizado com sucesso!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editarModal')).hide();
        await carregarEpis();

    } catch (error) {
        mostrarMensagem(error.message || 'Erro ao atualizar EPI.', 'danger');
    } finally {
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-save me-1"></i>Salvar Alterações';
        btn.disabled = false;
    }
}

// =============================================
// CRUD - EXCLUIR EPI
// =============================================
function prepararExclusao(epi) {
    epiParaExcluir = epi;
    document.getElementById('excluirNomeEpi').textContent = epi.descricao;
    document.getElementById('excluirCodigoEpi').textContent = epi.codigo;
    const imgEl = document.getElementById('excluirImagemEpi');
    imgEl.src = epi.imagem || IMG_PLACEHOLDER;
    imgEl.onerror = function() { this.src = IMG_PLACEHOLDER; };

    new bootstrap.Modal(document.getElementById('excluirModal')).show();
}

async function confirmarExclusao() {
    if (!epiParaExcluir) return;

    const btn = document.getElementById('confirmarExclusaoBtn');
    const spinner = document.getElementById('exclusaoSpinner');
    const texto = document.getElementById('exclusaoTexto');

    spinner.classList.remove('d-none');
    texto.innerHTML = 'Excluindo...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/epis/${epiParaExcluir.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao excluir EPI');

        mostrarMensagem(`EPI "${epiParaExcluir.descricao}" excluído com sucesso!`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('excluirModal')).hide();
        epiParaExcluir = null;
        await carregarEpis();

    } catch (error) {
        mostrarMensagem(error.message || 'Erro ao excluir EPI.', 'danger');
    } finally {
        spinner.classList.add('d-none');
        texto.innerHTML = '<i class="bi bi-trash me-1"></i>Excluir EPI';
        btn.disabled = false;
    }
}

// =============================================
// PAGINAÇÃO
// =============================================
function renderizarPaginacao(total) {
    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');

    if (totalPaginas <= 1) { paginacao.innerHTML = ''; return; }

    let html = `
        <li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual - 1})">Anterior</a>
        </li>`;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <li class="page-item ${i === paginaAtual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="mudarPagina(${i})">${i}</a>
            </li>`;
    }

    html += `
        <li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual + 1})">Próximo</a>
        </li>`;

    paginacao.innerHTML = html;
}

function mudarPagina(n) {
    const total = Math.ceil(epis.length / ITENS_POR_PAGINA);
    if (n >= 1 && n <= total) {
        paginaAtual = n;
        renderizarLista(document.getElementById('buscaEpi').value);
    }
}

// =============================================
// MENSAGENS
// =============================================
function mostrarMensagem(msg, tipo = 'info') {
    document.querySelectorAll('.alert-temp').forEach(el => el.remove());

    const div = document.createElement('div');
    div.className = `alert alert-${tipo} alert-temp position-fixed top-0 end-0 m-3 shadow`;
    div.style.zIndex = '9999';
    div.style.maxWidth = '380px';
    div.innerHTML = `
        <i class="bi ${tipo === 'success' ? 'bi-check-circle' : tipo === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2"></i>
        ${msg}`;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}