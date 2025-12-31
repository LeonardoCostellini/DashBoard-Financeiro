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
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

// =======================
// CATEGORIAS (BANCO)
// =======================
async function carregarCategorias() {
  const res = await fetch("/api/categories/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const dados = await res.json();
  categoriaSelect.innerHTML = "";

  dados
    .filter(c => c.tipo === tipoSelect.value)
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      categoriaSelect.appendChild(opt);
    });
}

tipoSelect.addEventListener("change", carregarCategorias);

// =======================
// TRANSAÇÕES
// =======================
async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Erro ao carregar");
    return;
  }

  transacoes = data;
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico();
}

// =======================
// CRIAR TRANSAÇÃO
// =======================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const valor = parseValorBrasileiro(form.valor.value);
  if (isNaN(valor)) return alert("Valor inválido");

  let data = form.data.value;
  if (data.length === 7) data += "-01";

  const res = await fetch("/api/transactions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      valor,
      tipo: tipoSelect.value,
      categoria: categoriaSelect.value,
      data
    })
  });

  const r = await res.json();
  if (!res.ok) return alert(r.error || "Erro");

  form.reset();
  carregarTransacoes();
});

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
          <button class="bg-red-500 text-white px-3 py-1 rounded">
            Excluir
          </button>
        </td>
      `;

      tr.querySelector("button")
        .addEventListener("click", () => excluirTransacao(t.id));

      lista.appendChild(tr);
    }
  });
}

// =======================
// EXCLUIR
// =======================
async function excluirTransacao(id) {
  if (!confirm("Excluir transação?")) return;

  const res = await fetch(`/api/transactions/delete?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Erro");

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
      t.tipo === "entrada" ? ent += Number(t.valor) : sai += Number(t.valor);
    }
  });

  totalEntradas.textContent = formatarBrasileiro(ent);
  totalSaidas.textContent = formatarBrasileiro(sai);
  saldo.textContent = formatarBrasileiro(ent - sai);
}

// =======================
// GRÁFICO
// =======================
function atualizarGrafico() {
  let entrada = 0, saida = 0;
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      t.tipo === "entrada"
        ? entrada += Number(t.valor)
        : saida += Number(t.valor);
    }
  });

  const ctx = document.getElementById("grafico").getContext("2d");
  if (chartCombinado) chartCombinado.destroy();

  chartCombinado = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{ data: [entrada, saida] }]
    },
    options: { responsive: true }
  });
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  carregarCategorias();
  carregarTransacoes();
});

filtroMes.addEventListener("change", () => {
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico();
});
