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
const categorias = {
  entrada: [
    'Salário',
    'Bonificação',
    'Vale Alimentação',
    'Dinheiro Emprestado',
    '13°'
  ],
  saida: [
    'MORADIA (ALUGUEL/FINANCIAMENTO)',
    'CONDOMÍNIO',
    'SUPERMERCADO (VALOR MÉDIO)',
    'LUZ (INCLUSO NO CONDOMÍNIO?)',
    'GÁS (INCLUSO NO CONDOMÍNIO?)',
    'IPTU (INCLUSO NO CONDOMÍNIO?)',
    'PLANO DE SAÚDE',
    'SEGURO DE VIDA',
    'INVESTIMENTOS',
    'FALCULDADE',
    'RESERVA DE EMERGENCIA',
    'CARTÃO DE CRÉDITO',
    'COMBUSTÍVEL',
    'UNIMED',
    'GASTOS COM ANIMAIS',
    'GASTOS IMPREVISTOS',
    'GASTOS COM TRANSPORTE',
    'GASTOS COM VEÍCULO',
    'INTERNET RESIDENCIAL',
    'ASSINATURAS(EX:NETFLIX)',
    'PADARIA/FEIRA',
    'SAÍDAS/CINEMA/LAZER',
    'CABELEIRO',
    'TARIFAS BANCÁRIAS',
    'TELEFONIA/CELULAR'
  ]

};

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

async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) return;

  transacoes = data;
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico(); // ⬅️ aqui
}


// =======================
// CRIAR TRANSAÇÃO
// =======================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const valorInput = document.getElementById("valor").value;
  const valor = parseValorBrasileiro(valorInput);

  if (isNaN(valor)) {
    alert("Valor inválido");
    return;
  }

  let data = form.data.value;

  // 🔧 Converte YYYY-MM → YYYY-MM-01
  if (data.length === 7) {
    data = data + "-01";
  }

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
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const response = await res.json();
  console.log("API:", response);

  if (!res.ok) {
    alert(response.error || "Erro ao salvar");
    return;
  }

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
        <td>${formatarBrasileiro(Number(t.valor))}</td>
        <td>${t.tipo}</td>
        <td>${t.categoria}</td>
        <td>${t.data}</td>
        <td>
          <button
            class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            data-id="${t.id}"
          >
            Excluir
          </button>
        </td>
      `;

      const btn = tr.querySelector("button");
      btn.addEventListener("click", () => excluirTransacao(t.id));

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
    headers: {
      Authorization: "Bearer " + token
    }
  });

  let data;
  try {
    data = await res.json();
  } catch {
    alert("Erro inesperado no servidor");
    return;
  }

  if (!res.ok) {
    alert(data.error || "Erro ao excluir");
    return;
  }

  carregarTransacoes();
  atualizarGrafico();

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

function atualizarGrafico() {
  const canvas = document.getElementById("graficoCombinado");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Agrupar por categoria
  const categorias = {};

  transacoes.forEach(t => {
    if (!categorias[t.categoria]) {
      categorias[t.categoria] = { entrada: 0, saida: 0 };
    }

    if (t.tipo === "entrada") {
      categorias[t.categoria].entrada += Number(t.valor);
    } else {
      categorias[t.categoria].saida += Number(t.valor);
    }
  });

  const labels = Object.keys(categorias);
  const entradas = labels.map(cat => categorias[cat].entrada);
  const saidas = labels.map(cat => categorias[cat].saida);

  if (chartCombinado) {
    chartCombinado.destroy();
  }

  chartCombinado = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Entradas",
          data: entradas,
          backgroundColor: "rgba(34,197,94,0.7)"
        },
        {
          label: "Saídas",
          data: saidas,
          backgroundColor: "rgba(239,68,68,0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.dataset.label + ": " +
                ctx.raw.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                });
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: value =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })
          }
        }
      }
    }
  });
}



async function carregarCategorias() {
  const res = await fetch("/api/categories/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const categorias = await res.json();
  const select = document.getElementById("categoria");

  select.innerHTML = "<option value=''>Selecione</option>";

  categorias.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.nome;
    opt.textContent = cat.nome;
    select.appendChild(opt);
  });
}

// =======================
// METAS (BANCO)
// =======================
async function carregarMetas() {
  const res = await fetch("/api/metas/list", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const metas = await res.json();
  const container = document.getElementById("listaMetas");
  container.innerHTML = "";

  metas.forEach(meta => {
    container.innerHTML += renderizarMeta(meta);
  });
}

function renderizarMeta(meta) {
  const perc = Math.min(
    (meta.valor_atual / meta.valor_total) * 100,
    100
  ).toFixed(1);

  const concluida = meta.valor_atual >= meta.valor_total;

  let cor = "#f97316";
  if (perc >= 50) cor = "#eab308";
  if (perc >= 100) cor = "#22c55e";

  return `
    <div class="mb-6 p-4 bg-white shadow-md rounded-lg">
      <h4 class="text-lg font-bold mb-1">${meta.nome}</h4>

      <p class="text-sm text-gray-700 mb-2">
        ${formatarBrasileiro(meta.valor_atual)} de ${formatarBrasileiro(meta.valor_total)}
      </p>

      <div class="w-full bg-gray-200 rounded-lg h-6 mt-2 overflow-hidden relative">
        <div
          class="h-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
          style="width:${perc}%; background-color:${cor}; min-width:2rem">
          ${perc > 0 ? `${perc}%` : ""}
        </div>
        ${perc == 0 ? `<span class="absolute left-2 text-sm text-gray-500">0%</span>` : ""}
      </div>

      ${
        concluida
          ? `
          <p class="text-green-600 font-bold mt-2">🎉 Parabéns! Meta alcançada!</p>
          <button onclick="finalizarMeta(${meta.id})"
            class="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">
            Finalizar Meta
          </button>
        `
          : `
          <div class="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Novo valor"
              id="novaMeta-${meta.id}"
              class="border border-gray-300 rounded px-2 py-1 w-full"
            />
            <button onclick="atualizarMeta(${meta.id})"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">
              Atualizar
            </button>
          </div>
        `
      }
    </div>
  `;
}


document.getElementById("btnAddMeta").addEventListener("click", async () => {
  const nome = document.getElementById("nomeMeta").value.trim();
  const valor_total = parseValorBrasileiro(document.getElementById("valorMeta").value);
  const valor_atual = parseValorBrasileiro(document.getElementById("valorAtualMeta").value);

  if (!nome || isNaN(valor_total) || isNaN(valor_atual)) {
    alert("Preencha os dados corretamente.");
    return;
  }

  const res = await fetch("/api/metas/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ nome, valor_total, valor_atual })
  });

  if (!res.ok) return alert("Erro ao criar meta");

  document.getElementById("nomeMeta").value = "";
  document.getElementById("valorMeta").value = "";
  document.getElementById("valorAtualMeta").value = "";

  carregarMetas();
});

async function atualizarMeta(id) {
  const input = document.getElementById(`novaMeta-${id}`).value;
  const valor = parseValorBrasileiro(input);

  if (isNaN(valor) || valor <= 0) {
    alert("Valor inválido");
    return;
  }

  await fetch("/api/metas/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ id, valor })
  });

  carregarMetas();
}

async function finalizarMeta(id) {
  if (!confirm("Deseja finalizar esta meta?")) return;

  await fetch(`/api/metas/delete?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  carregarMetas();
}
