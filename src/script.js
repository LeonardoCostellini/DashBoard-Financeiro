console.log('Chart.js carregado?', typeof Chart !== 'undefined');


// Elementos principais
const form = document.getElementById('form-transacao');
const lista = document.getElementById('lista-transacoes');
const totalEntradas = document.getElementById('total-entradas');
const totalSaidas = document.getElementById('total-saidas');
const saldo = document.getElementById('saldo');
const categoriaSelect = document.getElementById('categoria');
const tipoSelect = document.getElementById('tipo');
const filtroMes = document.getElementById('filtro-mes');

let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let metas = JSON.parse(localStorage.getItem('metas')) || [];
let chartCombinado = null;

// Função para converter valores com vírgula e ponto (formato brasileiro)
function parseValorBrasileiro(valorStr) {
  return parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
}

function formatarBrasileiro(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Categorias padrão
let categorias = {
  entrada: ['Salário', 'Bonificação', 'Vale Alimentação', 'Dinheiro Emprestado', 'Rachão da Playstation'], // Adicione ou remova categorias conforme necessário
  saida: [
    'MORADIA (ALUGUEL/FINANCIAMENTO)', 'CONDOMÍNIO', 'SUPERMERCADO (VALOR MÉDIO)',
    'LUZ (INCLUSO NO CONDOMÍNIO?)', 'GÁS (INCLUSO NO CONDOMÍNIO?)', 'IPTU (INCLUSO NO CONDOMÍNIO?)',
    'PLANO DE SAÚDE', 'SEGURO DE VIDA', 'INVESTIMENTOS', 'FALCULDADE', 'RESERVA DE EMERGENCIA',
    'CARTÃO DE CRÉDITO', 'COMBUSTÍVEL', 'UNIMED', 'GASTOS COM ANIMAIS', 'GASTOS IMPREVISTOS',
    'GASTOS COM TRANSPORTE', 'GASTOS COM VEÍCULO', 'INTERNET RESIDENCIAL', 'PLAYSTATION/SPOTIFY',
    'PADARIA/FEIRA', 'SAÍDAS/CINEMA/LAZER', 'CABELEIRO', 'TARIFAS BANCÁRIAS', 'TELEFONIA/CELULAR',
  ]
};

// Salvar as categorias no localStorage
localStorage.setItem('categorias', JSON.stringify(categorias));

// Agora ao carregar as categorias do localStorage, elas estarão atualizadas
let categoriasSalvas = JSON.parse(localStorage.getItem('categorias')) || categorias;

// Certifique-se de que as categorias estão sendo carregadas corretamente
console.log(categoriasSalvas);

form.addEventListener('submit', e => {
  e.preventDefault();

  const valorBr = form.valor.value;
  const valorConvertido = parseValorBrasileiro(valorBr);

  if (isNaN(valorConvertido)) {
    alert('Por favor, insira um valor válido.');
    return;
  }

  const novaTransacao = {
    valor: valorBr,
    tipo: form.tipo.value,
    categoria: form.categoria.value,
    data: form.data.value,
  };
  
  transacoes.push(novaTransacao);
  salvar();
  form.reset();
  atualizarCategorias();
});

function atualizarCategorias() {
  const tipo = tipoSelect.value;
  categoriaSelect.innerHTML = '';
  categorias[tipo].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoriaSelect.appendChild(opt);
  });
}

function atualizarResumo() {
  let entradas = 0;
  let saidas = 0;
  const mesSelecionado = filtroMes.value;

  transacoes.forEach(t => {
    if (!mesSelecionado || t.data.startsWith(mesSelecionado)) {
      const valor = parseValorBrasileiro(t.valor);
      if (t.tipo === 'entrada') entradas += valor;
      else saidas += valor;
    }
  });

  totalEntradas.textContent = formatarBrasileiro(entradas);
  totalSaidas.textContent = formatarBrasileiro(saidas);
  saldo.textContent = formatarBrasileiro(entradas - saidas);

  atualizarGraficoCombinado();
}

//Lista de transações 

function renderizarTransacoes() {
  lista.innerHTML = '';
  const mesSelecionado = filtroMes.value;

  transacoes.forEach((t, index) => {
    if (!mesSelecionado || t.data.startsWith(mesSelecionado)) {
      const tr = document.createElement('tr');
      const valor = formatarBrasileiro(parseValorBrasileiro(t.valor));
      const tipoCor = t.tipo === 'entrada' ? 'text-green-500 font-bold' : 'text-red-500 font-bold';

      tr.className = "hover:bg-gray-50 dark:hover:bg-gray-700 transition";

      tr.innerHTML = `
        <td class="px-6 py-3 ${tipoCor}">${valor}</td>
        <td class="px-6 py-3 capitalize">${t.tipo}</td>
        <td class="px-6 py-3">${t.categoria}</td>
        <td class="px-6 py-3">${t.data}</td>
        <td class="px-6 py-3 text-center">
          <button class="text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-500 px-3 py-1 rounded-md transition"
                  onclick="excluirTransacao(${index})">
            Excluir
          </button>
        </td>
      `;

      lista.appendChild(tr);
    }
  });
}


function excluirTransacao(index) {
  if (confirm('Deseja realmente excluir esta transação?')) {
    transacoes.splice(index, 1);
    salvar();
  }
}


function salvar() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
  renderizarTransacoes();
  atualizarResumo();
}

function atualizarGraficoCombinado() {
  const ctx = document.getElementById('graficoCombinado');
  if (!ctx) return;

  const categoriasMap = {};
  const mesSelecionado = filtroMes.value;

  transacoes.forEach(t => {
    if (!mesSelecionado || t.data.startsWith(mesSelecionado)) {
      const cat = t.categoria;
      if (!categoriasMap[cat]) categoriasMap[cat] = { entrada: 0, saida: 0 };
      categoriasMap[cat][t.tipo] += parseValorBrasileiro(t.valor);
    }
  });

  const labels = Object.keys(categoriasMap);
  const entradas = labels.map(cat => categoriasMap[cat].entrada || 0);
  const saidas = labels.map(cat => categoriasMap[cat].saida || 0);

  if (chartCombinado) {
    chartCombinado.data.labels = labels;
    chartCombinado.data.datasets[0].data = entradas;
    chartCombinado.data.datasets[1].data = saidas;
    chartCombinado.update();
  } else {
    chartCombinado = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Entradas', data: entradas, backgroundColor: 'rgba(34, 197, 94, 0.7)' },
          { label: 'Saídas', data: saidas, backgroundColor: 'rgba(239, 68, 68, 0.7)' }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }
}

// Metas financeiras
function adicionarMeta() {
  const nome = document.getElementById('nomeMeta').value.trim();
  const objetivo = parseValorBrasileiro(document.getElementById('valorMeta').value);
  const atual = parseValorBrasileiro(document.getElementById('valorAtualMeta').value);

  if (!nome || isNaN(objetivo) || isNaN(atual) || objetivo <= 0 || atual < 0) {
    alert("Preencha os dados da meta corretamente.");
    return;
  }

  metas.push({ nome, objetivo, atual });
  localStorage.setItem("metas", JSON.stringify(metas));

  document.getElementById('nomeMeta').value = '';
  document.getElementById('valorMeta').value = '';
  document.getElementById('valorAtualMeta').value = '';

  renderizarMetas();
  alert(`Meta de ${nome} criada com valor objetivo ${formatarBrasileiro(objetivo)} e atual ${formatarBrasileiro(atual)}`);
}

function renderizarMetas() {
  const container = document.getElementById("listaMetas");
  container.innerHTML = '';

  metas.forEach((meta, index) => {
    const perc = Math.min((meta.atual / meta.objetivo) * 100, 100).toFixed(1);
    const concluida = meta.atual >= meta.objetivo;

    // Cor dinâmica opcional
    const cor = perc < 50 ? '#f97316' : perc < 100 ? '#eab308' : '#22c55e';

    const div = document.createElement("div");
    div.classList.add("meta", "mb-6", "p-4", "bg-white", "shadow-md", "rounded-lg");

    div.innerHTML = `
      <h4 class="text-lg font-bold mb-1">${meta.nome}</h4>
      <p class="text-sm text-gray-700 mb-2">${formatarBrasileiro(meta.atual)} de ${formatarBrasileiro(meta.objetivo)}</p>
      
<div class="w-full bg-gray-200 rounded-lg h-6 mt-2 overflow-hidden relative">
  <div class="h-full transition-all duration-500 ease-out rounded-lg text-sm font-semibold text-white flex items-center justify-center"
       style="width: ${perc}%; min-width: 2rem; background-color: ${cor};">
    ${perc > 0 ? `${perc}%` : ''}
  </div>
  ${perc == 0 ? `<span class="absolute left-2 text-sm text-gray-500">0%</span>` : ''}
</div>


      ${concluida ? `
        <p class="text-green-600 font-bold mt-2">🎉 Parabéns! Meta alcançada!</p>
        <button onclick="finalizarMeta(${index})"
                class="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">
          Finalizar Meta
        </button>
      ` : `
        <div class="mt-3 flex gap-2">
          <input type="text" placeholder="Novo valor" id="novaMeta-${index}"
                 class="border border-gray-300 rounded px-2 py-1 w-full" />
          <button onclick="atualizarMeta(${index})"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">
            Atualizar
          </button>
        </div>
      `}
    `;

    container.appendChild(div);
  });
}


function atualizarMeta(index) {
  const input = document.getElementById(`novaMeta-${index}`).value;
  const novoValor = parseValorBrasileiro(input);
  if (isNaN(novoValor) || novoValor < 0) return alert("Valor inválido.");
  metas[index].atual += novoValor;
  localStorage.setItem("metas", JSON.stringify(metas));
  renderizarMetas();
}

function finalizarMeta(index) {
  if (confirm("Tem certeza que deseja finalizar esta meta? Ela será removida.")) {
    metas.splice(index, 1);
    localStorage.setItem("metas", JSON.stringify(metas));
    renderizarMetas();
  }
}


  

// Nova categoria
function adicionarCategoria() {
  const novaCategoria = document.getElementById('inputNovaCategoria').value.trim();
  const tipo = tipoSelect.value;

  if (novaCategoria === '') {
    alert('Por favor, insira um nome para a nova categoria.');
    return;
  }

  if (!categorias[tipo].includes(novaCategoria)) {
    categorias[tipo].push(novaCategoria);
    localStorage.setItem('categorias', JSON.stringify(categorias));
    atualizarCategorias();
    document.getElementById('inputNovaCategoria').value = '';
    alert(`Categoria "${novaCategoria}" adicionada ao tipo "${tipo}".`);
  } else {
    alert('Essa categoria já existe!');
  }
}

// Eventos
document.getElementById("btnAddMeta").addEventListener("click", adicionarMeta);
document.getElementById('btnAddCategoria').addEventListener('click', adicionarCategoria);
filtroMes.addEventListener('change', () => {
  renderizarTransacoes();
  atualizarResumo();
});
tipoSelect.addEventListener('change', atualizarCategorias);

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
  const modoSalvo = localStorage.getItem('modoDark');
  if (modoSalvo === 'true') document.body.classList.add('dark-mode');

  atualizarCategorias();
  renderizarTransacoes();
  atualizarResumo();
  renderizarMetas();

});

