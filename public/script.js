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
let chartPrincipal = null;
let tipoGraficoAtual = 'bar'; // Tipo de gráfico padrão

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
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) {
    console.error("Erro ao carregar categorias");
    return;
  }

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

async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) return;

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

  const valorInput = document.getElementById("valor").value;
  const valor = parseValorBrasileiro(valorInput);

  if (isNaN(valor)) {
    alert("Valor inválido");
    return;
  }

  let data = form.data.value;

  // Converte YYYY-MM → YYYY-MM-01
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

      const corValor =
        t.tipo === "entrada" ? "text-green-600" : "text-red-600";

      const tr = document.createElement('tr');
      tr.className = "border-b hover:bg-gray-50";

      tr.innerHTML = `
        <td class="py-3 font-bold ${corValor}">
          ${formatarBrasileiro(Number(t.valor))}
        </td>

        <td class="py-3 capitalize">
          ${t.tipo}
        </td>

        <td class="py-3">
          ${t.categoria}
        </td>

        <td class="py-3">
          ${t.data}
        </td>

        <td class="py-3 text-right">
          <button
            class="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-600 hover:text-white transition-all"
            data-id="${t.id}">
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
}

// =======================
// RESUMO
// =======================
function atualizarResumo() {
  let ent = 0, sai = 0;
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      const valor = Number(t.valor);
      if (t.tipo === 'entrada') {
        ent += valor;
      } else {
        sai += valor;
      }
    }
  });

  totalEntradas.textContent = formatarBrasileiro(ent);
  totalSaidas.textContent = formatarBrasileiro(sai);
  saldo.textContent = formatarBrasileiro(ent - sai);
}

// =======================
// GRÁFICOS - MÚLTIPLOS TIPOS
// =======================
function atualizarGrafico() {
  const canvas = document.getElementById("graficoPrincipal");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const mes = filtroMes.value;

  const categorias = {};

  transacoes.forEach(t => {
    if (mes && !t.data.startsWith(mes)) return;

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

  if (chartPrincipal) {
    chartPrincipal.destroy();
  }

  // Configuração baseada no tipo de gráfico
  let chartConfig = {
    type: tipoGraficoAtual,
    data: {},
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              size: 12,
              weight: 'bold'
            },
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function (ctx) {
              const label = ctx.dataset.label || ctx.label || '';
              const value = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed;
              return label + ": " + value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              });
            }
          }
        }
      }
    }
  };

  // Cores modernas
  const coresEntrada = [
    'rgba(34, 197, 94, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(5, 150, 105, 0.8)'
  ];
  
  const coresSaida = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(220, 38, 38, 0.8)',
    'rgba(185, 28, 28, 0.8)'
  ];

  const coresMistas = [
    'rgba(210, 255, 0, 0.8)',
    'rgba(52, 211, 153, 0.8)',
    'rgba(96, 165, 250, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(244, 114, 182, 0.8)',
    'rgba(167, 139, 250, 0.8)'
  ];

  switch(tipoGraficoAtual) {
    case 'bar':
      chartConfig.data = {
        labels,
        datasets: [
          {
            label: "Entradas",
            data: entradas,
            backgroundColor: coresEntrada[0],
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2
          },
          {
            label: "Saídas",
            data: saidas,
            backgroundColor: coresSaida[0],
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2
          }
        ]
      };
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })
          }
        }
      };
      break;

    case 'pie':
    case 'doughnut':
      // Para pizza/rosca, mostrar todas as categorias com total
      const totalPorCategoria = labels.map((label, i) => 
        entradas[i] + saidas[i]
      );
      
      chartConfig.data = {
        labels,
        datasets: [{
          label: "Total por Categoria",
          data: totalPorCategoria,
          backgroundColor: coresMistas,
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      };
      break;

    case 'line':
      chartConfig.data = {
        labels,
        datasets: [
          {
            label: "Entradas",
            data: entradas,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: "Saídas",
            data: saidas,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      };
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })
          }
        }
      };
      break;
  }

  chartPrincipal = new Chart(ctx, chartConfig);
}

// =======================
// SELETOR DE TIPO DE GRÁFICO
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const chartButtons = document.querySelectorAll('.chart-btn');
  
  chartButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active de todos
      chartButtons.forEach(b => b.classList.remove('active'));
      
      // Adiciona active no clicado
      btn.classList.add('active');
      
      // Atualiza tipo e redesenha
      tipoGraficoAtual = btn.dataset.chart;
      atualizarGrafico();
      
      // Atualiza ícones
      lucide.createIcons();
    });
  });
});

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  filtroMes.value = mesAtual;

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

// =======================
// METAS (BANCO)
// =======================
async function carregarMetas() {
  const res = await fetch("/api/metas", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const metas = await res.json();
  const container = document.getElementById("listaMetas");
  container.innerHTML = "";

  metas.forEach(meta => {
    container.innerHTML += renderizarMeta(meta);
  });
  
  lucide.createIcons();
}

function renderizarMeta(meta) {
  const atual = Number(meta.valor_atual);
  const total = Number(meta.valor_total);

  const perc = total > 0
    ? Math.min((atual / total) * 100, 100)
    : 0;

  const concluida = atual >= total && total > 0;

  let cor = "#f97316"; // laranja
  let statusTexto = "Em progresso";

  if (perc >= 50) cor = "#eab308"; // amarelo
  if (perc >= 100) {
    cor = "#22c55e"; // verde
    statusTexto = "Meta concluída 🎉";
  }

  return `
    <div class="p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100">
      <div class="flex justify-between items-start mb-3">
        <h4 class="text-xl font-bold text-gray-800">${meta.nome}</h4>
        <span class="text-sm font-medium px-3 py-1 rounded-full ${concluida ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">
          ${perc.toFixed(1)}%
        </span>
      </div>

      <p class="text-sm text-gray-600 mb-3">
        ${formatarBrasileiro(meta.valor_atual)} de ${formatarBrasileiro(meta.valor_total)}
      </p>

      <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          class="h-full transition-all duration-500 rounded-full"
          style="width:${perc}%; background-color:${cor}">
        </div>
      </div>

      <p class="mt-3 font-semibold text-sm ${concluida ? "text-green-600" : "text-gray-600"}">
        ${statusTexto}
      </p>

      ${concluida
      ? `
            <button onclick="finalizarMeta(${meta.id})"
              class="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all">
              Finalizar Meta
            </button>
          `
      : `
            <div class="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Adicionar valor"
                id="novaMeta-${meta.id}"
                class="input-modern flex-1"
              />
              <button onclick="atualizarMeta(${meta.id})"
                class="btn-lime px-4 py-2 rounded-lg">
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

  const res = await fetch("/api/metas", {
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
  const incremento = parseValorBrasileiro(input);

  if (isNaN(incremento) || incremento <= 0) {
    alert("Valor inválido");
    return;
  }

  await fetch("/api/metas", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ id, incremento })
  });

  carregarMetas();
}

async function finalizarMeta(id) {
  if (!confirm("Deseja finalizar esta meta?")) return;

  await fetch(`/api/metas?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  carregarMetas();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarMetas();
  lucide.createIcons();
});
