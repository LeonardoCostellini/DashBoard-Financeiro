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


async function carregarTransacoes() {
  const res = await fetch("/api/transactions/list", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Erro ao carregar transações");
    return;
  }

  transacoes = data;
  renderizarTransacoes();
  atualizarResumo();
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
          <button onclick="excluirTransacao(${t.id})">Excluir</button>
        </td>
      `;
      lista.appendChild(tr);
    }
  });
}

// =======================
// EXCLUIR
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
