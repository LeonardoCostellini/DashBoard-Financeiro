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
// CATEGORIAS
// =======================
async function atualizarCategorias() {
  const res = await fetch("/api/categories/list", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const categorias = await res.json();
  categoriaSelect.innerHTML = "<option value=''>Selecione</option>";

  categorias
    .filter(cat => cat.tipo === tipoSelect.value)
    .forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.nome;
      opt.textContent = cat.nome;
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

  const data = await res.json();
  if (!Array.isArray(data)) return;

  // 🔥 NORMALIZA DATA (blindagem)
  transacoes = data.map(t => ({
    ...t,
    data: t.data || t.created_at || null
  }));

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

  if (!res.ok) return alert("Erro ao salvar");

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
    if (!t.data) return;
    if (mes && !String(t.data).startsWith(mes)) return;

    const corValor =
      t.tipo === "entrada" ? "text-green-500" : "text-red-500";

    const tr = document.createElement('tr');
    tr.className = "border-b hover:bg-gray-50";

    tr.innerHTML = `
      <td class="py-3 font-semibold ${corValor}">
        ${formatarBrasileiro(Number(t.valor))}
      </td>
      <td class="py-3 capitalize">${t.tipo}</td>
      <td class="py-3">${t.categoria}</td>
      <td class="py-3">${t.data}</td>
      <td class="py-3 text-right">
        <button class="border border-red-500 text-red-500 px-3 py-1 rounded"
          data-id="${t.id}">Excluir</button>
      </td>
    `;

    tr.querySelector("button")
      .addEventListener("click", () => excluirTransacao(t.id));

    lista.appendChild(tr);
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
    if (!t.data) return;
    if (mes && !String(t.data).startsWith(mes)) return;

    const valor = Number(t.valor);
    t.tipo === 'entrada' ? ent += valor : sai += valor;
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
  const mes = filtroMes.value;
  const categorias = {};

  transacoes.forEach(t => {
    if (!t.data) return;
    if (mes && !String(t.data).startsWith(mes)) return;

    if (!categorias[t.categoria]) {
      categorias[t.categoria] = { entrada: 0, saida: 0 };
    }

    categorias[t.categoria][t.tipo] += Number(t.valor);
  });

  if (chartCombinado) chartCombinado.destroy();

  chartCombinado = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(categorias),
      datasets: [
        { label: "Entradas", data: Object.values(categorias).map(c => c.entrada) },
        { label: "Saídas", data: Object.values(categorias).map(c => c.saida) }
      ]
    }
  });
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  filtroMes.value = new Date().toISOString().slice(0, 7);
  atualizarCategorias();
  carregarTransacoes();
  lucide.createIcons();
});

tipoSelect.addEventListener('change', atualizarCategorias);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico();
});
