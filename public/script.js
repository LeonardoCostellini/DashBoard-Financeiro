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

      const corValor =
        t.tipo === "entrada" ? "text-green-500" : "text-red-500";

      const tr = document.createElement('tr');
      tr.className = "border-b hover:bg-gray-50";

      tr.innerHTML = `
        <td class="py-3 font-semibold ${corValor}">
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
            class="border border-red-500 text-red-500 px-3 py-1 rounded
                   hover:bg-red-500 hover:text-white transition"
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
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM

  filtroMes.value = mesAtual;

  atualizarCategorias();
  carregarTransacoes();

  lucide.createIcons();
});



tipoSelect.addEventListener('change', atualizarCategorias);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico(); // ⬅️ ESSENCIAL
});

function atualizarGrafico() {
  const canvas = document.getElementById("graficoCombinado");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const mes = filtroMes.value; // ⬅️ ESSENCIAL

  const categorias = {};

  transacoes.forEach(t => {
    if (mes && !t.data.startsWith(mes)) return; // ⬅️ FILTRO REAL

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
  const res = await fetch("/api/categorias", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) return;

  const data = await res.json();
  categoriaSelect.innerHTML = "<option value=''>Selecione</option>";

  data
    .filter(cat => cat.tipo === tipoSelect.value)
    .forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.nome;
      opt.textContent = cat.nome;
      categoriaSelect.appendChild(opt);
    });
}

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
}

lucide.createIcons();

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
    <div class="mb-6 p-4 bg-white shadow-md rounded-lg">
      <h4 class="text-lg font-bold mb-1">${meta.nome}</h4>

      <p class="text-sm text-gray-700 mb-2">
        ${formatarBrasileiro(meta.valor_atual)} de ${formatarBrasileiro(meta.valor_total)}
      </p>

      <div class="w-full bg-gray-200 rounded-lg h-6 mt-2 overflow-hidden">
        <div
          class="h-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
          style="width:${perc}%; background-color:${cor}">
          ${perc.toFixed(1)}%
        </div>
      </div>

      <p class="mt-2 font-semibold ${concluida ? "text-green-600" : "text-gray-600"}">
        ${statusTexto}
      </p>

      ${concluida
      ? `
            <button onclick="finalizarMeta(${meta.id})"
              class="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">
              Finalizar Meta
            </button>
          `
      : `
            <div class="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Adicionar valor"
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
  carregarMetas();     // ⬅️ ISSO FAZ PUXAR DO BANCO
  lucide.createIcons();
});



// =======================
// GERENCIAMENTO DE CATEGORIAS PERSONALIZADAS
// =======================

const modalCategorias = document.getElementById("modalCategorias");
const btnMenuCategorias = document.getElementById("btnMenuCategorias");
const submenuCategorias = document.getElementById("submenuCategorias");
const btnAbrirCategorias = document.getElementById("btnAbrirCategorias");
const btnFecharModal = document.getElementById("btnFecharModal");
const formCategoria = document.getElementById("formCategoria");
const inputNomeCategoria = document.getElementById("inputNomeCategoria");
const inputTipoCategoria = document.getElementById("inputTipoCategoria");
const categoriaEditId = document.getElementById("categoriaEditId");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const btnTextoSalvar = document.getElementById("btnTextoSalvar");
const tituloFormCategoria = document.getElementById("tituloFormCategoria");
const listaCategoriasUsuario = document.getElementById("listaCategoriasUsuario");

// Toggle do submenu
btnMenuCategorias.addEventListener("click", (e) => {
  e.stopPropagation();
  submenuCategorias.classList.toggle("hidden");
});

// Fechar submenu ao clicar fora
document.addEventListener("click", () => {
  submenuCategorias.classList.add("hidden");
});

submenuCategorias.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Abrir modal de categorias
btnAbrirCategorias.addEventListener("click", () => {
  submenuCategorias.classList.add("hidden");
  modalCategorias.classList.add("show"); // Adiciona classe show

  const tipoAtual = tipoSelect.value || "entrada"; // fallback
  carregarCategoriasUsuario(tipoAtual);

  lucide.createIcons();
});


// Fechar modal
btnFecharModal.addEventListener("click", () => {
  modalCategorias.classList.remove("show"); // Remove classe show
  resetarFormCategoria();
});

// Fechar modal ao clicar fora
modalCategorias.addEventListener("click", (e) => {
  if (e.target === modalCategorias) {
    modalCategorias.classList.remove("show"); // Remove classe show
    resetarFormCategoria();
  }
});

// Cancelar edição
btnCancelarEdicao.addEventListener("click", () => {
  resetarFormCategoria();
});

// Resetar formulário
function resetarFormCategoria() {
  formCategoria.reset();
  categoriaEditId.value = "";
  btnCancelarEdicao.classList.add("hidden");
  btnTextoSalvar.textContent = "Criar Categoria";
  tituloFormCategoria.textContent = "Nova Categoria";
}

// Carregar categorias do usuário
async function carregarCategoriasUsuario(tipo) {
  if (!tipo) return; // 🔒 proteção

  try {
    const res = await fetch(`/api/user_categories?tipo=${tipo}`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar categorias");
    }

    const categorias = await res.json();
    listaCategoriasUsuario.innerHTML = "";

    if (categorias.length === 0) {
      listaCategoriasUsuario.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
          <p>Você ainda não criou nenhuma categoria personalizada.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    categorias.forEach(cat => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all";

      const tipoBadge = cat.tipo === "entrada"
        ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Entrada</span>'
        : '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Saída</span>';

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <i data-lucide="tag" class="w-5 h-5 text-gray-600"></i>
          <div>
            <p class="font-semibold text-gray-800">${cat.nome}</p>
            ${tipoBadge}
          </div>
        </div>
        <div class="flex gap-2">
          <button 
            onclick="editarCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")}', '${cat.tipo}')"
            class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-all"
            title="Editar">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button 
            onclick="excluirCategoria(${cat.id})"
            class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-all"
            title="Excluir">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      listaCategoriasUsuario.appendChild(div);
    });

    lucide.createIcons();

  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
    alert("Erro ao carregar suas categorias. Por favor, tente novamente.");
  }
}


// Criar ou atualizar categoria
formCategoria.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = inputNomeCategoria.value.trim();
  const tipo = inputTipoCategoria.value;
  const id = categoriaEditId.value;

  if (!nome || !tipo) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const isEdicao = id !== "";
    const method = isEdicao ? "PUT" : "POST";
    const body = isEdicao
      ? JSON.stringify({ id: parseInt(id), nome, tipo })
      : JSON.stringify({ nome, tipo });

    const res = await fetch("/api/user_categories", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erro ao salvar categoria");
    }

    // Atualizar lista de categorias no modal
    await carregarCategoriasUsuario(tipo);


    // Atualizar dropdown de categorias no formulário principal
    await atualizarCategorias();

    // Resetar formulário
    resetarFormCategoria();

    // Feedback visual
    alert(isEdicao ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!");

  } catch (err) {
    console.error("Erro ao salvar categoria:", err);
    alert(err.message || "Erro ao salvar categoria. Tente novamente.");
  }
});

// Editar categoria
window.editarCategoria = function (id, nome, tipo) {
  categoriaEditId.value = id;
  inputNomeCategoria.value = nome;
  inputTipoCategoria.value = tipo;

  btnCancelarEdicao.classList.remove("hidden");
  btnTextoSalvar.textContent = "Salvar Alterações";
  tituloFormCategoria.textContent = "Editar Categoria";

  // Scroll suave para o formulário
  formCategoria.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

// Excluir categoria
window.excluirCategoria = async function (id) {
  if (!confirm("Tem certeza que deseja excluir esta categoria?\n\nAtenção: Transações com esta categoria não serão excluídas.")) {
    return;
  }

  try {
    const res = await fetch(`/api/user_categories?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erro ao excluir categoria");
    }

    // Atualizar lista de categorias no modal
    const tipoAtual = tipoSelect.value || "entrada";
    await carregarCategoriasUsuario(tipoAtual);



    // Atualizar dropdown de categorias no formulário principal
    await atualizarCategorias();

    alert("Categoria excluída com sucesso!");

  } catch (err) {
    console.error("Erro ao excluir categoria:", err);
    alert(err.message || "Erro ao excluir categoria. Tente novamente.");
  }
};

