console.log('Chart.js carregado?', typeof Chart !== 'undefined');

// =======================
// AUTH
// =======================
const token = localStorage.getItem("token");
if (!token) location.href = "/login.html";

// =======================
// ELEMENTOS
// =======================
const form = document.getElementById('form-transacao');
const lista = document.getElementById('lista-transacoes');
const totalEntradas = document.getElementById('total-entradas');
const totalSaidas = document.getElementById('total-saidas');
const saldo = document.getElementById('saldo');
const categoriaSelect = document.getElementById('categoria');
const tipoSelect = document.getElementById('tipo');
const filtroMes = document.getElementById('filtro-mes');

let transacoes = [];
let chartCombinado = null;

// =======================
// UTILS
// =======================
function parseValorBrasileiro(v) {
  return parseFloat(v.replace(/\./g, '').replace(',', '.'));
}

function formatarBrasileiro(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// =======================
// CATEGORIAS (LOCAL POR ENQUANTO)
// =======================
const categorias = {
  entrada: ['Salário', 'Bonificação', 'Vale Alimentação'],
  saida: ['Aluguel', 'Supermercado', 'Luz', 'Internet']
};

function atualizarCategorias() {
  categoriaSelect.innerHTML = '';
  categorias[tipoSelect.value].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoriaSelect.appendChild(opt);
  });
}

// =======================
// CRIAR TRANSAÇÃO (BANCO)
// =======================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const payload = {
    valor: parseValorBrasileiro(form.valor.value),
    tipo: form.tipo.value,
    categoria: form.categoria.value,
    data: form.data.value
  };

  const res = await fetch("/api/transactions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Erro ao salvar transação");
    return;
  }

  form.reset();
  carregarTransacoes();
});

// =======================
// LISTAR TRANSAÇÕES (BANCO)
// =======================
async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const dados = await res.json();

  if (!res.ok) {
    alert("Erro ao carregar transações");
    return;
  }

  transacoes = dados;
  renderizarTransacoes();
  atualizarResumo();
}

// =======================
// RENDER
// =======================
function renderizarTransacoes() {
  lista.innerHTML = '';
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatarBrasileiro(t.valor)}</td>
        <td>${t.tipo}</td>
        <td>${t.categoria}</td>
        <td>${t.data}</td>
        <td>
          <button onclick="excluirTransacao('${t.id}')">Excluir</button>
        </td>
      `;
      lista.appendChild(tr);
    }
  });
}

// =======================
// EXCLUIR (BANCO)
// =======================
async function excluirTransacao(id) {
  if (!confirm("Excluir transação?")) return;

  await fetch(`/api/transactions/delete?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

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
      t.tipo === 'entrada' ? ent += t.valor : sai += t.valor;
    }
  });

  totalEntradas.textContent = formatarBrasileiro(ent);
  totalSaidas.textContent = formatarBrasileiro(sai);
  saldo.textContent = formatarBrasileiro(ent - sai);
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  atualizarCategorias();
  carregarTransacoes();
});

tipoSelect.addEventListener('change', atualizarCategorias);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
});
