// =======================
// MODERN FINANCIAL DASHBOARD
// =======================

console.log('Modern Dashboard iniciado');

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
let currentChart = null;
let currentChartType = 'bar';

// =======================
// UTILS
// =======================
function parseValorBrasileiro(v) {
  if (!v) return 0;
  return parseFloat(v.toString().replace(/\./g, '').replace(',', '.'));
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
async function atualizarCategorias(selectElement = categoriaSelect) {
  const tipo = selectElement === categoriaSelect ? tipoSelect.value : document.getElementById('editTipo').value;
  
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

  selectElement.innerHTML = "<option value=''>Selecione</option>";

  categorias
    .filter(cat => cat.tipo === tipo)
    .forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.nome;
      opt.textContent = cat.nome;
      selectElement.appendChild(opt);
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

  if (isNaN(valor) || valor <= 0) {
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
  
  // Feedback visual
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i><span>Adicionado!</span>';
  lucide.createIcons();
  setTimeout(() => {
    btn.innerHTML = originalText;
    lucide.createIcons();
  }, 2000);
});

// =======================
// RENDER TRANSAÇÕES
// =======================
function renderizarTransacoes() {
  lista.innerHTML = '';
  const mes = filtroMes.value;

  transacoes.forEach(t => {
    if (!mes || t.data.startsWith(mes)) {
      const corValor = t.tipo === "entrada" ? "value-income" : "value-expense";
      const tipoBadge = t.tipo === "entrada" ? "income" : "expense";

      const tr = document.createElement('tr');
      tr.style.animation = 'fadeInUp 0.3s ease';

      tr.innerHTML = `
        <td class="${corValor}">
          ${formatarBrasileiro(Number(t.valor))}
        </td>
        <td>
          <span class="type-badge ${tipoBadge}">
            ${t.tipo}
          </span>
        </td>
        <td>${t.categoria}</td>
        <td>${new Date(t.data).toLocaleDateString('pt-BR')}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-edit" data-id="${t.id}" onclick="abrirModalEditar(${t.id})" data-testid="edit-transaction-btn-${t.id}">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button class="btn btn-delete" data-id="${t.id}" data-testid="delete-transaction-btn-${t.id}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;

      const btnDelete = tr.querySelector(".btn-delete");
      btnDelete.addEventListener("click", () => excluirTransacao(t.id));

      lista.appendChild(tr);
    }
  });
  
  lucide.createIcons();
}

// =======================
// EDITAR TRANSAÇÃO
// =======================
window.abrirModalEditar = async function(id) {
  const transacao = transacoes.find(t => t.id === id);
  if (!transacao) return;

  document.getElementById('editId').value = transacao.id;
  document.getElementById('editValor').value = transacao.valor.toString().replace('.', ',');
  document.getElementById('editTipo').value = transacao.tipo;
  
  // Atualizar categorias do modal
  await atualizarCategorias(document.getElementById('editCategoria'));
  document.getElementById('editCategoria').value = transacao.categoria;
  
  // Converter data para YYYY-MM
  const dataPartes = transacao.data.split('-');
  document.getElementById('editData').value = `${dataPartes[0]}-${dataPartes[1]}`;

  document.getElementById('modalEditarTransacao').classList.add('show');
  lucide.createIcons();
};

window.fecharModalEditar = function() {
  document.getElementById('modalEditarTransacao').classList.remove('show');
  document.getElementById('formEditarTransacao').reset();
};

document.getElementById('formEditarTransacao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const valorInput = document.getElementById('editValor').value;
  const valor = parseValorBrasileiro(valorInput);
  const tipo = document.getElementById('editTipo').value;
  const categoria = document.getElementById('editCategoria').value;
  let data = document.getElementById('editData').value;

  if (isNaN(valor) || valor <= 0) {
    alert("Valor inválido");
    return;
  }

  // Converte YYYY-MM → YYYY-MM-01
  if (data.length === 7) {
    data = data + "-01";
  }

  const payload = {
    id: parseInt(id),
    valor,
    tipo,
    categoria,
    data
  };

  const res = await fetch("/api/transactions/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json();
    alert(error.error || "Erro ao atualizar");
    return;
  }

  fecharModalEditar();
  carregarTransacoes();
  
  // Feedback
  alert("Transação atualizada com sucesso!");
});

// Atualizar categorias quando tipo mudar no modal de edição
document.getElementById('editTipo').addEventListener('change', () => {
  atualizarCategorias(document.getElementById('editCategoria'));
});

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

  const saldoFinal = ent - sai;

  totalEntradas.textContent = formatarBrasileiro(ent);
  totalSaidas.textContent = formatarBrasileiro(sai);
  saldo.textContent = formatarBrasileiro(saldoFinal);
  
  // Atualizar cor do saldo
  saldo.style.color = saldoFinal >= 0 ? 'var(--success)' : 'var(--danger)';
}

// =======================
// GRÁFICOS MODERNOS
// =======================
function atualizarGrafico() {
  const canvas = document.getElementById("mainChart");
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

  if (currentChart) {
    currentChart.destroy();
  }

  // Configuração baseada no tipo de gráfico
  const chartConfig = getChartConfig(currentChartType, labels, entradas, saidas);
  
  currentChart = new Chart(ctx, chartConfig);
}

function getChartConfig(type, labels, entradas, saidas) {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: '#f1f5f9',
          font: {
            size: 13,
            weight: '600'
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
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
    }
  };

  switch(type) {
    case 'pie':
      return {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Gastos',
            data: saidas,
            backgroundColor: [
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(6, 182, 212, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
          }]
        },
        options: commonOptions
      };

    case 'doughnut':
      return {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Gastos',
            data: saidas,
            backgroundColor: [
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(6, 182, 212, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
          }]
        },
        options: commonOptions
      };

    case 'line':
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: "Entradas",
              data: entradas,
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(16, 185, 129)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            },
            {
              label: "Saídas",
              data: saidas,
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(239, 68, 68)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1',
                callback: value => value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1'
              }
            }
          }
        }
      };

    case 'area':
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: "Entradas",
              data: entradas,
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.3)',
              tension: 0.4,
              fill: true
            },
            {
              label: "Saídas",
              data: saidas,
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              stacked: false,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1',
                callback: value => value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1'
              }
            }
          }
        }
      };

    case 'bar':
    default:
      return {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Entradas",
              data: entradas,
              backgroundColor: "rgba(16, 185, 129, 0.8)",
              borderColor: "rgb(16, 185, 129)",
              borderWidth: 2,
              borderRadius: 8
            },
            {
              label: "Saídas",
              data: saidas,
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 2,
              borderRadius: 8
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1',
                callback: value => value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#cbd5e1'
              }
            }
          }
        }
      };
  }
}

// Chart Selector
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentChartType = tab.dataset.chart;
    atualizarGrafico();
  });
});

// =======================
// METAS
// =======================
async function carregarMetas() {
  const res = await fetch("/api/metas", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const metas = await res.json();
  const container = document.getElementById("listaMetas");
  container.innerHTML = "";

  if (metas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <i data-lucide="target" class="w-12 h-12" style="margin: 0 auto 1rem; opacity: 0.5;"></i>
        <p>Nenhuma meta criada ainda</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  metas.forEach(meta => {
    container.innerHTML += renderizarMeta(meta);
  });
  
  lucide.createIcons();
}

function renderizarMeta(meta) {
  const atual = Number(meta.valor_atual);
  const total = Number(meta.valor_total);
  const perc = total > 0 ? Math.min((atual / total) * 100, 100) : 0;
  const concluida = atual >= total && total > 0;

  return `
    <div class="goal-card" data-testid="goal-card-${meta.id}">
      <div class="goal-header">
        <h4 class="goal-name">${meta.nome}</h4>
        <span style="color: var(--text-secondary); font-size: 0.875rem;">
          ${perc.toFixed(1)}%
        </span>
      </div>
      
      <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
        ${formatarBrasileiro(meta.valor_atual)} de ${formatarBrasileiro(meta.valor_total)}
      </p>

      <div class="goal-progress-bar">
        <div class="goal-progress-fill" style="width: ${perc}%"></div>
      </div>

      ${concluida
        ? `
          <button onclick="finalizarMeta(${meta.id})" class="btn btn-success" style="margin-top: 1rem; width: 100%;" data-testid="finish-goal-btn-${meta.id}">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>Finalizar Meta</span>
          </button>
        `
        : `
          <div class="flex gap-2" style="margin-top: 1rem;">
            <input
              type="text"
              placeholder="Adicionar valor"
              id="novaMeta-${meta.id}"
              class="input-field"
              style="flex: 1;"
              data-testid="goal-add-value-input-${meta.id}"
            />
            <button onclick="atualizarMeta(${meta.id})" class="btn btn-primary" data-testid="update-goal-btn-${meta.id}">
              <i data-lucide="plus" class="w-5 h-5"></i>
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

window.atualizarMeta = async function(id) {
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
};

window.finalizarMeta = async function(id) {
  if (!confirm("Deseja finalizar esta meta?")) return;

  await fetch(`/api/metas?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  carregarMetas();
};

// =======================
// CATEGORIAS PERSONALIZADAS
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
  submenuCategorias.classList.toggle("show");
});

// Fechar submenu ao clicar fora
document.addEventListener("click", () => {
  submenuCategorias.classList.remove("show");
});

submenuCategorias.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Abrir modal de categorias
btnAbrirCategorias.addEventListener("click", () => {
  submenuCategorias.classList.remove("show");
  modalCategorias.classList.add("show");

  const tipoAtual = tipoSelect.value || "entrada";
  carregarCategoriasUsuario(tipoAtual);

  lucide.createIcons();
});

// Fechar modal
btnFecharModal.addEventListener("click", () => {
  modalCategorias.classList.remove("show");
  resetarFormCategoria();
});

// Fechar modal ao clicar fora
modalCategorias.addEventListener("click", (e) => {
  if (e.target === modalCategorias) {
    modalCategorias.classList.remove("show");
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
  if (!tipo) return;

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
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <i data-lucide="folder-open" class="w-12 h-12" style="margin: 0 auto 1rem; opacity: 0.5;"></i>
          <p>Nenhuma categoria personalizada criada</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    categorias.forEach(cat => {
      const div = document.createElement("div");
      div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 0.75rem; transition: all 0.3s;';
      
      div.onmouseenter = () => div.style.background = 'rgba(255, 255, 255, 0.05)';
      div.onmouseleave = () => div.style.background = 'rgba(255, 255, 255, 0.03)';

      const tipoBadge = cat.tipo === "entrada"
        ? '<span class="type-badge income" style="margin-left: 0.5rem;">Entrada</span>'
        : '<span class="type-badge expense" style="margin-left: 0.5rem;">Saída</span>';

      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i data-lucide="tag" class="w-5 h-5" style="color: var(--text-muted);"></i>
          <div>
            <span style="font-weight: 600;">${cat.nome}</span>
            ${tipoBadge}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button 
            onclick="editarCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")}', '${cat.tipo}')"
            class="btn btn-edit"
            style="padding: 0.5rem;"
            title="Editar"
            data-testid="edit-category-btn-${cat.id}">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button 
            onclick="excluirCategoria(${cat.id})"
            class="btn btn-delete"
            style="padding: 0.5rem;"
            title="Excluir"
            data-testid="delete-category-btn-${cat.id}">
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

    await carregarCategoriasUsuario(tipo);
    await atualizarCategorias();
    resetarFormCategoria();
    alert(isEdicao ? "Categoria atualizada!" : "Categoria criada!");

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

  formCategoria.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

// Excluir categoria
window.excluirCategoria = async function (id) {
  if (!confirm("Tem certeza que deseja excluir esta categoria?\n\nTransações com esta categoria não serão excluídas.")) {
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

    const tipoAtual = tipoSelect.value || "entrada";
    await carregarCategoriasUsuario(tipoAtual);
    await atualizarCategorias();

    alert("Categoria excluída com sucesso!");

  } catch (err) {
    console.error("Erro ao excluir categoria:", err);
    alert(err.message || "Erro ao excluir categoria. Tente novamente.");
  }
};

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  filtroMes.value = mesAtual;
  document.getElementById("data").value = mesAtual;

  atualizarCategorias();
  carregarTransacoes();
  carregarMetas();

  lucide.createIcons();
});

tipoSelect.addEventListener('change', atualizarCategorias);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
  atualizarGrafico();
});

function logout() {
  localStorage.removeItem("token");
  location.href = "/login.html";
}
