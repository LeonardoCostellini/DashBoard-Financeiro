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
  const canvas = document.getElementById("grafico");
  if (!canvas) return; // ⛑️ evita erro

  let entrada = 0, saida = 0;
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      t.tipo === "entrada"
        ? entrada += Number(t.valor)
        : saida += Number(t.valor);
    }
  });

  if (chartCombinado) chartCombinado.destroy();

  chartCombinado = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{ data: [entrada, saida] }]
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

function renderMeta(meta) {
  return `
    <div class="bg-white p-4 rounded shadow mb-2">
      <h3>${meta.nome}</h3>
      <p>R$ ${meta.valor_atual} / R$ ${meta.valor_total}</p>
      <div class="w-full bg-gray-200 h-3 rounded">
        <div class="bg-green-500 h-3 rounded" style="width:${meta.progresso}%"></div>
      </div>
    </div>
  `;
}

