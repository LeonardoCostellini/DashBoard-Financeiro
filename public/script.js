// =======================
// AUTH
// =======================
const token = localStorage.getItem("token");
if (!token) location.href = "/login.html";

// =======================
// ELEMENTOS
// =======================
const form            = document.getElementById('form-transacao');
const lista           = document.getElementById('lista-transacoes');
const totalEntradas   = document.getElementById('total-entradas');
const totalSaidas     = document.getElementById('total-saidas');
const saldoEl         = document.getElementById('saldo');
const categoriaSelect = document.getElementById('categoria');
const tipoSelect      = document.getElementById('tipo');
const filtroMes       = document.getElementById('filtro-mes');

let transacoes = [];

// =======================
// UTILS
// =======================
function parseValorBrasileiro(v) {
  if (!v) return NaN;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
}

function formatarBrasileiro(v) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2
  });
}

// Remove skeleton assim que o dado chegar
function removeSkeleton(el) {
  el.classList.remove('skeleton');
}

// =======================
// CATEGORIAS
// =======================
async function atualizarCategorias() {
  const res = await fetch("/api/categories/list", {
    headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) return;

  const cats = await res.json();
  categoriaSelect.innerHTML = "<option value=''>Selecione</option>";
  cats
    .filter(c => c.tipo === tipoSelect.value)
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      categoriaSelect.appendChild(opt);
    });
}

// =======================
// CARREGAR TRANSAÇÕES
// =======================
async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) return;

  transacoes = await res.json();
  renderizarTransacoes();
  atualizarResumo();
  if (typeof atualizarGrafico === 'function') atualizarGrafico();
}

// =======================
// CRIAR TRANSAÇÃO
// =======================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const valor = parseValorBrasileiro(document.getElementById("valor").value);
  if (isNaN(valor) || valor <= 0) {
    showToast("Informe um valor válido.", "error"); return;
  }

  let data = form.data.value;
  if (!data) { showToast("Selecione o mês de referência.", "error"); return; }
  if (data.length === 7) data += "-01";

  if (!categoriaSelect.value) {
    showToast("Selecione uma categoria.", "error"); return;
  }

  const payload = { valor, tipo: tipoSelect.value, categoria: categoriaSelect.value, data };

  const res = await fetch("/api/transactions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify(payload)
  });

  const response = await res.json();
  if (!res.ok) { showToast(response.error || "Erro ao salvar transação.", "error"); return; }

  showToast("Transação adicionada com sucesso!", "success");
  form.reset();
  // restaura mês atual no input data após reset
  const hoje = new Date();
  document.getElementById('data').value = hoje.toISOString().slice(0,7);
  carregarTransacoes();
});

// =======================
// RENDERIZAR TABELA
// =======================
function renderizarTransacoes() {
  lista.innerHTML = '';
  const mes = filtroMes.value;

  let filtradas = transacoes.filter(t => !mes || t.data.startsWith(mes));

  // Ordenação
  const ordenacao = document.getElementById('ordenacao')?.value || 'data-desc';
  const [campo, dir] = ordenacao.split('-');
  filtradas = [...filtradas].sort((a, b) => {
    let va, vb;
    if (campo === 'valor') { va = Number(a.valor); vb = Number(b.valor); }
    else if (campo === 'tipo') { va = a.tipo; vb = b.tipo; }
    else if (campo === 'categoria') { va = a.categoria?.toLowerCase(); vb = b.categoria?.toLowerCase(); }
    else { va = a.data; vb = b.data; } // data

    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  if (filtradas.length === 0) {
    lista.innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text3);">
        Nenhuma transação neste período.
      </td></tr>`;
    return;
  }

  filtradas.forEach(t => {
    const dataFormatada = t.data.substring(0, 7);
    const isEntrada = t.tipo === 'entrada';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;color:${isEntrada ? 'var(--green)' : 'var(--red)'}">
        ${formatarBrasileiro(Number(t.valor))}
      </td>
      <td>
        <span class="badge ${isEntrada ? 'badge-green' : 'badge-red'}">
          ${isEntrada ? '↑' : '↓'} ${t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)}
        </span>
      </td>
      <td style="color:var(--text2)">${t.categoria}</td>
      <td style="color:var(--text3)">${dataFormatada}</td>
      <td style="text-align:right">
        <button class="btn btn-danger btn-sm" data-id="${t.id}" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </td>`;

    tr.querySelector("button").addEventListener("click", () => excluirTransacao(t.id));
    lista.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons({ nodes: Array.from(lista.querySelectorAll('[data-lucide]')) });
}

// =======================
// EXCLUIR
// =======================
async function excluirTransacao(id) {
  if (!confirm("Excluir esta transação?")) return;

  const res = await fetch(`/api/transactions/delete?id=${id}`, {
    method: "DELETE", headers: { Authorization: "Bearer " + token }
  });

  let data;
  try { data = await res.json(); } catch { showToast("Erro inesperado.", "error"); return; }

  if (!res.ok) { showToast(data.error || "Erro ao excluir.", "error"); return; }

  showToast("Transação excluída.", "success");
  carregarTransacoes();
}

// =======================
// RESUMO
// =======================
function atualizarResumo() {
  let ent = 0, sai = 0;
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      const v = Number(t.valor);
      if (t.tipo === 'entrada') ent += v; else sai += v;
    }
  });

  totalEntradas.textContent = formatarBrasileiro(ent);
  totalSaidas.textContent   = formatarBrasileiro(sai);
  saldoEl.textContent       = formatarBrasileiro(ent - sai);

  // cor dinâmica do saldo
  saldoEl.className = 'card-value ' + (ent - sai >= 0 ? 'green' : 'red');

  removeSkeleton(totalEntradas);
  removeSkeleton(totalSaidas);
  removeSkeleton(saldoEl);
}

// =======================
// GRÁFICO DE BARRAS
// =======================
function atualizarGrafico() {
  const canvas = document.getElementById("graficoCombinado");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const mes = filtroMes.value;
  const cats = {};

  transacoes.forEach(t => {
    if (mes && !t.data.startsWith(mes)) return;
    if (!cats[t.categoria]) cats[t.categoria] = { entrada: 0, saida: 0 };
    if (t.tipo === "entrada") cats[t.categoria].entrada += Number(t.valor);
    else cats[t.categoria].saida += Number(t.valor);
  });

  const labels   = Object.keys(cats);
  const entradas = labels.map(c => cats[c].entrada);
  const saidas   = labels.map(c => cats[c].saida);

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: entradas, backgroundColor: "rgba(0,200,83,0.7)", borderRadius: 4 },
        { label: "Saídas",   data: saidas,   backgroundColor: "rgba(239,68,68,0.7)", borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#B0BEC5', usePointStyle: true, font: { family: 'Inter, sans-serif', size: 12 } } },
        tooltip: {
          backgroundColor: '#1a2332',
          titleColor: '#fff',
          bodyColor: '#B0BEC5',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              return typeof v === 'number' ? ctx.dataset.label + ": " + v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : '';
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#78909C',
            callback: v => typeof v === 'number' ? 'R$ ' + (v / 1000 >= 1 ? (v/1000).toFixed(0)+'k' : v.toLocaleString('pt-BR', {minimumFractionDigits:0})) : ''
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        x: {
          ticks: { color: '#78909C', maxRotation: 30 },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// =======================
// METAS
// =======================
async function carregarMetas() {
  const res = await fetch("/api/metas", { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) return;

  const metas = await res.json();
  const container = document.getElementById("listaMetas");
  container.innerHTML = "";
  metas.forEach(m => container.insertAdjacentHTML('beforeend', renderizarMeta(m)));
  if (window.lucide) lucide.createIcons({ nodes: [container] });
}

function renderizarMeta(meta) {
  const atual  = Number(meta.valor_atual);
  const total  = Number(meta.valor_total);
  const perc   = total > 0 ? Math.min((atual / total) * 100, 100) : 0;
  const done   = atual >= total && total > 0;

  let cor = '#f97316';
  let statusTxt = 'Em progresso';
  if (perc >= 50) cor = '#eab308';
  if (perc >= 100) { cor = '#00C853'; statusTxt = 'Concluída 🎉'; }

  return `
    <div class="meta-card">
      <div class="meta-card-header">
        <span class="meta-name">${meta.nome}</span>
        <span class="badge" style="background:rgba(255,255,255,0.06);color:var(--text2);font-size:0.75rem;">
          ${perc.toFixed(1)}%
        </span>
      </div>
      <div class="meta-values">${formatarBrasileiro(atual)} de ${formatarBrasileiro(total)}</div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${perc}%;background:${cor};"></div>
      </div>
      <div class="meta-status ${done ? 'done' : ''}">${statusTxt}</div>
      ${done
        ? `<button onclick="finalizarMeta(${meta.id})" class="btn btn-primary btn-sm" style="margin-top:0.75rem;">
             <i data-lucide="check"></i> Finalizar Meta
           </button>`
        : `<div class="meta-update-row">
             <input type="text" placeholder="Adicionar valor" id="novaMeta-${meta.id}">
             <button onclick="atualizarMeta(${meta.id})" class="btn btn-ghost btn-sm">Atualizar</button>
           </div>`
      }
    </div>`;
}

document.getElementById("btnAddMeta").addEventListener("click", async () => {
  const nome        = document.getElementById("nomeMeta").value.trim();
  const valor_total = parseValorBrasileiro(document.getElementById("valorMeta").value);
  const valor_atual = parseValorBrasileiro(document.getElementById("valorAtualMeta").value);

  if (!nome || isNaN(valor_total) || isNaN(valor_atual)) {
    showToast("Preencha todos os dados da meta.", "error"); return;
  }

  const res = await fetch("/api/metas", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ nome, valor_total, valor_atual })
  });

  if (!res.ok) { showToast("Erro ao criar meta.", "error"); return; }

  showToast("Meta criada com sucesso!", "success");
  document.getElementById("nomeMeta").value = "";
  document.getElementById("valorMeta").value = "";
  document.getElementById("valorAtualMeta").value = "";
  carregarMetas();
});

async function atualizarMeta(id) {
  const incremento = parseValorBrasileiro(document.getElementById(`novaMeta-${id}`).value);
  if (isNaN(incremento) || incremento <= 0) { showToast("Valor inválido.", "error"); return; }

  await fetch("/api/metas", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ id, incremento })
  });
  showToast("Meta atualizada!", "success");
  carregarMetas();
}

async function finalizarMeta(id) {
  if (!confirm("Finalizar e remover esta meta?")) return;
  await fetch(`/api/metas?id=${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
  showToast("Meta finalizada!", "success");
  carregarMetas();
}

// =======================
// MODAL CATEGORIAS
// =======================
const modalCategorias      = document.getElementById("modalCategorias");
const btnAbrirCategorias   = document.getElementById("btnAbrirCategorias");
const btnFecharModal       = document.getElementById("btnFecharModal");
const formCategoria        = document.getElementById("formCategoria");
const inputNomeCategoria   = document.getElementById("inputNomeCategoria");
const inputTipoCategoria   = document.getElementById("inputTipoCategoria");
const categoriaEditId      = document.getElementById("categoriaEditId");
const btnCancelarEdicao    = document.getElementById("btnCancelarEdicao");
const btnTextoSalvar       = document.getElementById("btnTextoSalvar");
const tituloFormCategoria  = document.getElementById("tituloFormCategoria");
const listaCategoriasUsuario = document.getElementById("listaCategoriasUsuario");

function abrirModal() {
  modalCategorias.style.display = 'flex';
  carregarCategoriasUsuario(); // carrega todas as categorias sem filtro de tipo
  if (window.lucide) lucide.createIcons();
}
function fecharModal() {
  modalCategorias.style.display = 'none';
  resetarFormCategoria();
}

btnAbrirCategorias.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);
modalCategorias.addEventListener("click", e => { if (e.target === modalCategorias) fecharModal(); });
btnCancelarEdicao.addEventListener("click", resetarFormCategoria);

function resetarFormCategoria() {
  formCategoria.reset();
  categoriaEditId.value = "";
  btnCancelarEdicao.style.display = 'none';
  btnTextoSalvar.textContent = "Criar Categoria";
  tituloFormCategoria.innerHTML = '<i data-lucide="plus-circle"></i> Nova Categoria';
  if (window.lucide) lucide.createIcons({ nodes: [tituloFormCategoria] });
}

async function carregarCategoriasUsuario(tipo) {
  // Se tipo não informado, carrega todos (sem filtro)
  const url = tipo
    ? `/api/user_categories?tipo=${tipo}`
    : `/api/user_categories`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error();

    const cats = await res.json();
    listaCategoriasUsuario.innerHTML = "";

    if (cats.length === 0) {
      listaCategoriasUsuario.innerHTML = `
        <div style="text-align:center;color:var(--text3);padding:2rem;">
          <i data-lucide="folder-open" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.4;display:block;margin-inline:auto;"></i>
          Nenhuma categoria personalizada ainda.
        </div>`;
      if (window.lucide) lucide.createIcons({ nodes: [listaCategoriasUsuario] });
      return;
    }

    cats.forEach(cat => {
      const div = document.createElement("div");
      div.className = "cat-item";
      div.innerHTML = `
        <div class="cat-item-info">
          <i data-lucide="tag"></i>
          <div>
            <div class="cat-item-name">${cat.nome}</div>
            <span class="badge ${cat.tipo === 'entrada' ? 'badge-green' : 'badge-red'}" style="font-size:0.7rem;">
              ${cat.tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </div>
        </div>
        <div class="cat-item-actions">
          <button onclick="editarCategoria(${cat.id},'${cat.nome.replace(/'/g,"\\'")}','${cat.tipo}')" class="btn btn-ghost btn-sm" title="Editar">
            <i data-lucide="edit-2"></i>
          </button>
          <button onclick="excluirCategoria(${cat.id})" class="btn btn-danger btn-sm" title="Excluir">
            <i data-lucide="trash-2"></i>
          </button>
        </div>`;
      listaCategoriasUsuario.appendChild(div);
    });
    if (window.lucide) lucide.createIcons({ nodes: [listaCategoriasUsuario] });
  } catch { showToast("Erro ao carregar categorias.", "error"); }
}

formCategoria.addEventListener("submit", async e => {
  e.preventDefault();
  const nome = inputNomeCategoria.value.trim();
  const tipo = inputTipoCategoria.value;
  const id   = categoriaEditId.value;
  if (!nome || !tipo) { showToast("Preencha todos os campos.", "error"); return; }

  const isEdicao = id !== "";
  const res = await fetch("/api/user_categories", {
    method: isEdicao ? "PUT" : "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(isEdicao ? { id: parseInt(id), nome, tipo } : { nome, tipo })
  });

  if (!res.ok) { const err = await res.json(); showToast(err.error || "Erro ao salvar.", "error"); return; }

  showToast(isEdicao ? "Categoria atualizada!" : "Categoria criada!", "success");
  await carregarCategoriasUsuario(); // recarrega todas
  await atualizarCategorias();
  resetarFormCategoria();
});

window.editarCategoria = function(id, nome, tipo) {
  categoriaEditId.value = id;
  inputNomeCategoria.value = nome;
  inputTipoCategoria.value = tipo;
  btnCancelarEdicao.style.display = 'inline-flex';
  btnTextoSalvar.textContent = "Salvar Alterações";
  tituloFormCategoria.textContent = "Editar Categoria";
  formCategoria.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

window.excluirCategoria = async function(id) {
  if (!confirm("Excluir esta categoria?\nAs transações existentes não serão afetadas.")) return;
  const res = await fetch(`/api/user_categories?id=${id}`, {
    method: "DELETE", headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) { const err = await res.json(); showToast(err.error || "Erro ao excluir.", "error"); return; }
  showToast("Categoria excluída.", "success");
  await carregarCategoriasUsuario(); // recarrega todas
  await atualizarCategorias();
};

// =======================
// INIT
// =======================
async function inicializarDados() {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  filtroMes.value = mesAtual;
  document.getElementById('data').value = mesAtual;

  if (typeof atualizarSubtitulo === 'function') atualizarSubtitulo(mesAtual);

  // Carrega tudo em paralelo, garantindo dados frescos a cada acesso
  await Promise.all([
    atualizarCategorias(),
    carregarTransacoes(),
    carregarMetas()
  ]);

  lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", inicializarDados);

tipoSelect.addEventListener('change', atualizarCategorias);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
  if (typeof atualizarGrafico === 'function') atualizarGrafico();
});

// Fix 4: re-renderiza ao mudar ordenação
document.addEventListener('DOMContentLoaded', () => {
  const ordenacaoEl = document.getElementById('ordenacao');
  if (ordenacaoEl) ordenacaoEl.addEventListener('change', renderizarTransacoes);
});
