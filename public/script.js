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
const listaMetas = document.getElementById("lista-metas");

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
async function atualizarCategorias() {
  const res = await fetch("/api/categories/list", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const data = await res.json();
  categoriaSelect.innerHTML = "";

  data
    .filter(c => c.tipo === tipoSelect.value)
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      categoriaSelect.appendChild(opt);
    });
}

// =======================
// TRANSAÇÕES
// =======================
async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  transacoes = await res.json();
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico();
}

// =======================
// CRIAR TRANSAÇÃO
// =======================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const valor = parseValorBrasileiro(document.getElementById("valor").value);
  if (isNaN(valor)) return alert("Valor inválido");

  let data = form.data.value;
  if (data.length === 7) data += "-01";

  const payload = {
    valor,
    tipo: tipoSelect.value,
    categoria: categoriaSelect.value,
    data
  };

  const res = await fetch("/api/transactions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    return alert(err.error || "Erro ao salvar");
  }

  form.reset();
  carregarTransacoes();
});

// =======================
// RENDER TRANSAÇÕES
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
// EXCLUIR TRANSAÇÃO
// =======================
async function excluirTransacao(id) {
  if (!confirm("Excluir transação?")) return;

  const res = await fetch(`/api/transactions/delete?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return alert("Erro ao excluir");

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
      t.tipo === "entrada" ? ent += t.valor : sai += t.valor;
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
  const canvas = document.getElementById("graficoCombinado");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const map = {};

  transacoes.forEach(t => {
    if (!map[t.categoria]) map[t.categoria] = { entrada: 0, saida: 0 };
    map[t.categoria][t.tipo] += t.valor;
  });

  if (chartCombinado) chartCombinado.destroy();

  chartCombinado = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(map),
      datasets: [
        { label: "Entradas", data: Object.values(map).map(v => v.entrada) },
        { label: "Saídas", data: Object.values(map).map(v => v.saida) }
      ]
    },
    options: { responsive: true }
  });
}

// =======================
// METAS
// =======================
function renderMeta(meta) {
  const progresso = Math.min(
    Math.round((meta.valor_atual / meta.valor_total) * 100),
    100
  );

  return `
    <div class="bg-white p-4 rounded shadow mb-3">
      <h3 class="font-semibold">${meta.nome}</h3>
      <p>${formatarBrasileiro(meta.valor_atual)} / ${formatarBrasileiro(meta.valor_total)}</p>
      <div class="w-full bg-gray-200 h-3 rounded">
        <div class="bg-green-500 h-3 rounded" style="width:${progresso}%"></div>
      </div>
    </div>
  `;
}

async function carregarMetas() {
  const res = await fetch("/api/metas/list", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const metas = await res.json();
  listaMetas.innerHTML = "";
  metas.forEach(m => listaMetas.innerHTML += renderMeta(m));
}

document.getElementById("form-meta").addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("meta-nome").value;
  const valor_total = parseValorBrasileiro(document.getElementById("meta-valor").value);

  const res = await fetch("/api/metas/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ nome, valor_total })
  });

  if (!res.ok) return alert("Erro ao criar meta");

  e.target.reset();
  carregarMetas();
});

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  atualizarCategorias();
  carregarTransacoes();
  carregarMetas();
});

tipoSelect.addEventListener("change", atualizarCategorias);
filtroMes.addEventListener("change", () => {
  renderizarTransacoes();
  atualizarResumo();
});
