// =============================================
// CONFIGURAÇÃO GLOBAL
// =============================================
const API_BASE = '/api';
let token = localStorage.getItem('token');

// Estado da cadeia de logs
let todosLogs = [];
let logsFiltrados = [];
let paginaLogs = 1;
const LOGS_POR_PAGINA = 20;

// Estado dos hashes diários
let todosHashesDiarios = [];
let hashesFiltrados = [];
let paginaDiarios = 1;
const DIARIOS_POR_PAGINA = 15;

// Log selecionado para modal
let logSelecionado = null;
let hashDiarioSelecionado = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!token) { window.location.href = '/'; return; }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.nome || 'Usuário';

    document.getElementById('logoutBtn').addEventListener('click', e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/';
    });

    // Filtros em tempo real
    document.getElementById('buscaLog').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroEvento').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroUsuario').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroDataInicio').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroDataFim').addEventListener('change', aplicarFiltros);

    // Definir mês atual no filtro de diários
    const hoje = new Date();
    document.getElementById('filtroMes').value =
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // Carregar dados iniciais
    carregarResumo();
    carregarLogs();

    // Carregar diários ao abrir aba
    document.getElementById('diarios-tab').addEventListener('shown.bs.tab', () => {
        if (todosHashesDiarios.length === 0) carregarHashesDiarios();
    });
});

// =============================================
// RESUMO / CARDS
// =============================================
async function carregarResumo() {
    try {
        const [rLogs, rDiarios] = await Promise.all([
            fetch(`${API_BASE}/audit-logs`, { headers: auth() }),
            fetch(`${API_BASE}/audit-logs/daily-hashes`, { headers: auth() })
        ]);

        const logs = rLogs.ok ? await rLogs.json() : [];
        //const diarios = rDiarios.ok ? await rDiarios.json() : [];

        document.getElementById('totalLogs').textContent = logs["total"] ?? '—';
        //document.getElementById('totalDiarios').textContent = diarios.length ?? '—';
        const usuarios = new Set(logs["items"].map(l => l.usuario).filter(Boolean));
        document.getElementById('totalUsuarios').textContent = usuarios.size;

        // Verificar integridade da cadeia
        const integra = verificarCadeia(logs);
        const el = document.getElementById('integridadeStatus');
        if (integra) {
            el.innerHTML = '<span class="text-success fw-bold">✅ OK</span>';
        } else {
            el.innerHTML = '<span class="text-danger fw-bold">❌ Falha</span>';
        }

    } catch (e) {
        console.error('Erro ao carregar resumo:', e);
    }
}

// =============================================
// CADEIA DE LOGS
// =============================================
async function carregarLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = loadingRow(8);

    try {
        const response = await fetch(`${API_BASE}/audit-logs`, { headers: auth() });
        if (!response.ok) throw new Error('Erro ao carregar logs');

        todosLogs = await response.json();
        aplicarFiltros();

    } catch (e) {
        tbody.innerHTML = erroRow(8, e.message);
    }
}

function aplicarFiltros() {
    const busca = document.getElementById('buscaLog').value.toLowerCase();
    const evento = document.getElementById('filtroEvento').value;
    const usuario = document.getElementById('filtroUsuario').value.toLowerCase();
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    logsFiltrados = todosLogs["items"].filter(log => {
        const matchBusca = !busca ||
            log.evento?.toLowerCase().includes(busca) ||
            log.usuario?.toLowerCase().includes(busca) ||
            JSON.stringify(log.dados || '').toLowerCase().includes(busca);
        const matchEvento = !evento || log.evento === evento;
        const matchUsuario = !usuario || log.usuario?.toLowerCase().includes(usuario);

        const ts = new Date(log.timestamp);
        const matchInicio = !dataInicio || ts >= new Date(dataInicio);
        const matchFim = !dataFim || ts <= new Date(dataFim + 'T23:59:59');

        return matchBusca && matchEvento && matchUsuario && matchInicio && matchFim;
    });
    paginaLogs = 1;
    renderizarLogs();
}

function limparFiltros() {
    document.getElementById('buscaLog').value = '';
    document.getElementById('filtroEvento').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    aplicarFiltros();
}

function renderizarLogs() {
    const tbody = document.getElementById('logsTableBody');
    const inicio = (paginaLogs - 1) * LOGS_POR_PAGINA;
    const pagina = logsFiltrados.slice(inicio, inicio + LOGS_POR_PAGINA);
    document.getElementById('infoRegistros').textContent =
        `Exibindo ${inicio + 1}–${Math.min(inicio + LOGS_POR_PAGINA, logsFiltrados.length)} de ${logsFiltrados.length} registros`;

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">
            <i class="bi bi-journal-x me-1"></i>Nenhum log encontrado</td></tr>`;
        document.getElementById('paginacaoLogs').innerHTML = '';
        return;
    }

    // Verificar cadeia para marcar elos quebrados
    const cadeiaOk = mapearCadeia(todosLogs);
    tbody.innerHTML = pagina.map((log, idx) => {
        const i = inicio + idx;
        const ts = formatarData(log.timestamp);
        const eventoClass = classeEvento(log.evento);
        const cadeiaValida = cadeiaOk[log.id] !== false;
        const hashAnt = log.hash_anterior || '—';
        const hashAtual = log.hash_atual || '—';
        console.log("cheguei aqui")
        return `
        <tr class="${!cadeiaValida ? 'table-danger' : ''}" style="cursor:pointer;"
            onclick='abrirDetalhesLog(${JSON.stringify(log).replace(/'/g, "&#39;")}, ${cadeiaValida})'>
            <td class="text-muted small">${log.id}</td>
            <td class="small">${ts}</td>
            <td><span class="badge ${eventoClass}">${log.evento}</span></td>
            <td class="small text-truncate" style="max-width:250px;">
                ${resumirDados(log.dados)}
            </td>
            <td>
                <span class="badge bg-secondary">
                    <i class="bi bi-person me-1"></i>${log.usuario || '—'}
                </span>
            </td>
            <td>
                <span class="font-monospace small text-muted" title="${hashAnt}">
                    ${truncarHash(hashAnt)}
                </span>
            </td>
            <td>
                <span class="font-monospace small text-success" title="${hashAtual}">
                    ${truncarHash(hashAtual)}
                </span>
            </td>
            <td class="text-center">
                ${cadeiaValida
                    ? '<i class="bi bi-link text-success fs-5" title="Cadeia íntegra"></i>'
                    : '<i class="bi bi-link-45deg text-danger fs-5" title="Cadeia quebrada!"></i>'
                }
            </td>
        </tr>`;
    }).join('');

    renderizarPaginacao('paginacaoLogs', logsFiltrados.length, LOGS_POR_PAGINA, paginaLogs, n => {
        paginaLogs = n;
        renderizarLogs();
    });
}

// =============================================
// MODAL DETALHES DO LOG
// =============================================
function abrirDetalhesLog(log, cadeiaValida) {
    logSelecionado = log;

    document.getElementById('detId').textContent = log.id;
    document.getElementById('detTimestamp').textContent = formatarData(log.timestamp);
    document.getElementById('detUsuario').textContent = log.usuario || '—';
    document.getElementById('detEvento').innerHTML =
        `<span class="badge ${classeEvento(log.evento)} fs-6">${log.evento}</span>`;

    // Dados formatados como JSON
    let dadosFormatados = '—';
    try {
        const obj = typeof log.dados === 'string' ? JSON.parse(log.dados) : log.dados;
        dadosFormatados = JSON.stringify(obj, null, 2);
    } catch {
        dadosFormatados = String(log.dados || '—');
    }
    document.getElementById('detDados').textContent = dadosFormatados;

    document.getElementById('detHashAnterior').textContent = log.hash_anterior || '(primeiro registro)';
    document.getElementById('detHashAtual').textContent = log.hash_atual || '—';

    // Status da cadeia
    const statusEl = document.getElementById('detCadeiaStatus');
    if (cadeiaValida) {
        statusEl.innerHTML = `
            <div class="alert alert-success d-flex align-items-center gap-2 mb-0">
                <i class="bi bi-shield-check fs-5"></i>
                <div><strong>Cadeia íntegra</strong> — Este registro está corretamente encadeado ao anterior.</div>
            </div>`;
    } else {
        statusEl.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center gap-2 mb-0">
                <i class="bi bi-shield-x fs-5"></i>
                <div><strong>Cadeia quebrada!</strong> — O hash anterior não corresponde ao hash do registro anterior.</div>
            </div>`;
    }

    new bootstrap.Modal(document.getElementById('detalhesModal')).show();
}

function copiarHash() {
    if (!logSelecionado) return;
    navigator.clipboard.writeText(logSelecionado.hash_atual || '');
    mostrarMensagem('Hash copiado para a área de transferência!', 'success');
}

// =============================================
// HASHES DIÁRIOS
// =============================================
async function carregarHashesDiarios() {
    const tbody = document.getElementById('diariosTableBody');
    tbody.innerHTML = loadingRow(7);

    const mes = document.getElementById('filtroMes').value;
    const status = document.getElementById('filtroStatus').value;

    let url = `${API_BASE}/audit-logs/daily-hashes`;
    if (mes) url += `?mes=${mes}`;

    try {
        const response = await fetch(url, { headers: auth() });
        if (!response.ok) throw new Error('Erro ao carregar hashes diários');

        todosHashesDiarios = await response.json();

        hashesFiltrados = todosHashesDiarios.filter(h => {
            if (!status) return true;
            return status === 'ok' ? h.integro !== false : h.integro === false;
        });

        paginaDiarios = 1;
        renderizarHashesDiarios();

    } catch (e) {
        tbody.innerHTML = erroRow(7, e.message);
    }
}

function limparFiltrosDiarios() {
    const hoje = new Date();
    document.getElementById('filtroMes').value =
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filtroStatus').value = '';
    carregarHashesDiarios();
}

function renderizarHashesDiarios() {
    const tbody = document.getElementById('diariosTableBody');
    const inicio = (paginaDiarios - 1) * DIARIOS_POR_PAGINA;
    const pagina = hashesFiltrados.slice(inicio, inicio + DIARIOS_POR_PAGINA);

    document.getElementById('infoDiarios').textContent =
        `${hashesFiltrados.length} registro(s) encontrado(s)`;

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-calendar-x me-1"></i>Nenhum hash diário encontrado</td></tr>`;
        document.getElementById('paginacaoDiarios').innerHTML = '';
        return;
    }

    tbody.innerHTML = pagina.map((h, idx) => {
        const i = inicio + idx + 1;
        const integro = h.integro !== false;
        const dataRef = formatarDataSimples(h.data_referencia || h.data);
        const geradoEm = formatarData(h.created_at || h.gerado_em);
        return `
        <tr style="cursor:pointer;"
            onclick='abrirDetalhesDiario(${JSON.stringify(h).replace(/'/g, "&#39;")})'>
            <td class="text-muted small">${i}</td>
            <td>
                <span class="fw-bold">${dataRef}</span>
            </td>
            <td>
                <span class="font-monospace small text-success text-break" title="${h.hash}">
                    ${truncarHash(h.hash, 24)}
                </span>
            </td>
            <td class="text-center">
                <span class="badge bg-primary">${h.quantidade_logs ?? '—'}</span>
            </td>
            <td class="small text-muted">${geradoEm}</td>
            <td class="text-center">
                ${integro
                    ? '<span class="badge bg-success"><i class="bi bi-shield-check me-1"></i>Íntegro</span>'
                    : '<span class="badge bg-danger"><i class="bi bi-shield-x me-1"></i>Falha</span>'
                }
            </td>
            <td>
                <button class="btn btn-sm btn-outline-dark" title="Ver detalhes"
                        onclick='event.stopPropagation(); abrirDetalhesDiario(${JSON.stringify(h).replace(/'/g, "&#39;")})'>
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    renderizarPaginacao('paginacaoDiarios', hashesFiltrados.length, DIARIOS_POR_PAGINA, paginaDiarios, n => {
        paginaDiarios = n;
        renderizarHashesDiarios();
    });
}

// // =============================================
// // MODAL DETALHES HASH DIÁRIO
// // =============================================
// function abrirDetalhesDiario(h) {
//     hashDiarioSelecionado = h;

//     const dataRef = formatarDataSimples(h.data_referencia || h.data);
//     document.getElementById('ddData').textContent = dataRef;
//     document.getElementById('ddDataRef').textContent = dataRef;
//     document.getElementById('ddGeradoEm').textContent = formatarData(h.created_at || h.gerado_em);
//     document.getElementById('ddQtdLogs').textContent = h.quantidade_logs ?? '—';
//     document.getElementById('ddHash').textContent = h.hash || '—';

//     const integro = h.integro !== false;
//     document.getElementById('ddIntegridade').innerHTML = integro
//         ? '<span class="badge bg-success fs-6"><i class="bi bi-shield-check me-1"></i>Íntegro</span>'
//         : '<span class="badge bg-danger fs-6"><i class="bi bi-shield-x me-1"></i>Falha detectada</span>';

//     // Logs do dia (se a API retornar)
//     const listEl = document.getElementById('ddLogsList');
//     const container = document.getElementById('ddLogsContainer');
//     if (h.logs && h.logs.length > 0) {
//         container.classList.remove('d-none');
//         listEl.innerHTML = h.logs.map(l => `
//             <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
//                 <div>
//                     <span class="badge ${classeEvento(l.evento)} me-2">${l.evento}</span>
//                     <small class="text-muted">${formatarData(l.timestamp)}</small>
//                     <small class="ms-2">${l.usuario || ''}</small>
//                 </div>
//                 <span class="font-monospace small text-muted">${truncarHash(l.hash_atual)}</span>
//             </div>`).join('');
//     } else {
//         container.classList.add('d-none');
//     }

//     new bootstrap.Modal(document.getElementById('detalheDiarioModal')).show();
// }

async function verificarIntegridadeDia() {
    if (!hashDiarioSelecionado) return;

    const btn = document.getElementById('btnVerificarDia');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Verificando...';

    try {
        const data = hashDiarioSelecionado.data_referencia || hashDiarioSelecionado.data;
        const dataFmt = data.split('T')[0];

        const response = await fetch(`${API_BASE}/audit-logs/integrity/${dataFmt}`, {
            headers: auth()
        });

        if (!response.ok) throw new Error('Erro ao verificar integridade');

        const resultado = await response.json();
        const integro = resultado.integro !== false && resultado.valid !== false;

        document.getElementById('ddIntegridade').innerHTML = integro
            ? '<span class="badge bg-success fs-6"><i class="bi bi-shield-check me-1"></i>Íntegro ✓</span>'
            : '<span class="badge bg-danger fs-6"><i class="bi bi-shield-x me-1"></i>Falha detectada!</span>';

        mostrarMensagem(
            integro ? 'Integridade verificada com sucesso!' : 'Falha de integridade detectada!',
            integro ? 'success' : 'danger'
        );

    } catch (e) {
        mostrarMensagem(e.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-shield-check me-1"></i>Verificar Integridade';
    }
}

async function verificarIntegridadeGeral() {
    mostrarMensagem('Verificando integridade de todos os dias...', 'info');

    let falhas = 0;
    for (const h of todosHashesDiarios) {
        try {
            const data = (h.data_referencia || h.data || '').split('T')[0];
            if (!data) continue;

            const r = await fetch(`${API_BASE}/audit-logs/integrity/${data}`, { headers: auth() });
            if (r.ok) {
                const res = await r.json();
                if (res.integro === false || res.valid === false) falhas++;
            }
        } catch { falhas++; }
    }

    if (falhas === 0) {
        mostrarMensagem(`✅ Todos os ${todosHashesDiarios.length} dias verificados — Integridade OK!`, 'success');
    } else {
        mostrarMensagem(`❌ ${falhas} dia(s) com falha de integridade detectados!`, 'danger');
    }

    carregarHashesDiarios();
    carregarResumo();
}

function copiarHashDiario() {
    if (!hashDiarioSelecionado) return;
    navigator.clipboard.writeText(hashDiarioSelecionado.hash || '');
    mostrarMensagem('Hash copiado para a área de transferência!', 'success');
}

// =============================================
// UTILITÁRIOS DE CADEIA
// =============================================
function verificarCadeia(logs) {
    if (!logs || logs.length === 0) return true;
    const ordenados = [...logs["items"]].sort((a, b) => a.id - b.id);
    for (let i = 1; i < ordenados.length; i++) {
        if (ordenados[i].hash_anterior !== ordenados[i - 1].hash_atual) return false;
    }
    return true;
}

function mapearCadeia(logs) {
    const resultado = {};
    if (!logs["items"] || logs["items"].length === 0) return resultado;
    const ordenados = [...logs["items"]].sort((a, b) => a.id - b.id);
    resultado[ordenados[0].id] = true;
    for (let i = 1; i < ordenados.length; i++) {
        resultado[ordenados[i].id] =
            ordenados[i].hash_anterior === ordenados[i - 1].hash_atual;
    }
    return resultado;
}

// =============================================
// PAGINAÇÃO GENÉRICA
// =============================================
function renderizarPaginacao(elId, total, porPagina, atual, callback) {
    const totalPaginas = Math.ceil(total / porPagina);
    const el = document.getElementById(elId);

    if (totalPaginas <= 1) { el.innerHTML = ''; return; }

    const maxBotoes = 5;
    let inicio = Math.max(1, atual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);
    if (fim - inicio < maxBotoes - 1) inicio = Math.max(1, fim - maxBotoes + 1);

    let html = `
        <li class="page-item ${atual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); (${callback})(${atual - 1})">‹</a>
        </li>`;

    if (inicio > 1) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;

    for (let i = inicio; i <= fim; i++) {
        html += `
            <li class="page-item ${i === atual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); (${callback})(${i})">${i}</a>
            </li>`;
    }

    if (fim < totalPaginas) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;

    html += `
        <li class="page-item ${atual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); (${callback})(${atual + 1})">›</a>
        </li>`;

    el.innerHTML = html;
}

// =============================================
// HELPERS
// =============================================
function auth() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function formatarData(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function formatarDataSimples(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function truncarHash(hash, len = 8) {
    if (!hash || hash === '—') return '—';
    return hash.length > len ? hash.substring(0, len) + '…' : hash;
}

function resumirDados(dados) {
    if (!dados) return '<span class="text-muted">—</span>';
    try {
        const obj = typeof dados === 'string' ? JSON.parse(dados) : dados;
        const keys = Object.keys(obj).slice(0, 3);
        return keys.map(k => `<span class="badge bg-light text-dark border me-1">${k}: ${String(obj[k]).substring(0, 20)}</span>`).join('');
    } catch {
        return String(dados).substring(0, 60);
    }
}

function classeEvento(evento) {
    const map = {
        'CREATE': 'bg-success',
        'UPDATE': 'bg-primary',
        'DELETE': 'bg-danger',
        'LOGIN':  'bg-info text-dark',
        'LOGOUT': 'bg-secondary'
    };
    return map[evento] || 'bg-dark';
}

function loadingRow(cols) {
    return `<tr><td colspan="${cols}" class="text-center py-4">
        <div class="spinner-border text-dark"></div></td></tr>`;
}

function erroRow(cols, msg) {
    return `<tr><td colspan="${cols}" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-triangle me-1"></i>${msg}</td></tr>`;
}

function mostrarMensagem(msg, tipo = 'info') {
    document.querySelectorAll('.alert-temp').forEach(el => el.remove());
    const div = document.createElement('div');
    div.className = `alert alert-${tipo} alert-temp position-fixed top-0 end-0 m-3 shadow`;
    div.style.cssText = 'z-index:9999;max-width:400px;';
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', info: 'info-circle', warning: 'exclamation-circle' };
    div.innerHTML = `<i class="bi bi-${icons[tipo] || 'info-circle'} me-2"></i>${msg}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}