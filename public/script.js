console.log('Chart.js carregado?', typeof Chart !== 'undefined');

if (!localStorage.getItem("token")) {
  location.href = "/login.html";
}


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

// Investimentos
let rendaFixa = [];
let acoes = [];
let chartInvestimentos;

// Função para verificar se uma data é um dia útil
function eDiaUtil(data) {
  const dia = data.getDay();
  return dia !== 0 && dia !== 6; // 0: domingo, 6: sábado
}

// Função para ajustar a data para o próximo dia útil
function proximoDiaUtil(data) {
  let novaData = new Date(data);
  while (!eDiaUtil(novaData)) {
    novaData.setDate(novaData.getDate() + 1); // Avança para o próximo dia útil
  }
  return novaData;
}

// Função para calcular dias úteis entre duas datas
function calcularDiasUteis(dataInicial, dataFinal) {
  let dias = 0;
  let dataAtual = new Date(dataInicial);

  while (dataAtual <= dataFinal) {
    if (eDiaUtil(dataAtual)) {
      dias++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  return dias;
}

// Função para calcular dias corridos entre duas datas
function calcularDiasCorridos(dataInicial, dataFinal) {
  const umDia = 24 * 60 * 60 * 1000; // em milissegundos
  const diff = Math.abs(dataFinal - dataInicial);
  return Math.floor(diff / umDia); // Retorna a diferença em dias corridos
}

// Função para calcular a Renda Fixa
function calcularRendaFixa(valor, taxaAnual, dataAplicacao) {
  const hoje = new Date(); // Data de hoje
  const dataInicio = proximoDiaUtil(new Date(dataAplicacao)); // Ajustando para o próximo dia útil
  const diasUteis = calcularDiasUteis(dataInicio, hoje); // Calculando os dias úteis para o rendimento

  if (diasUteis < 0) {
    return { error: "Data de aplicação no futuro" };
  }

  // Cálculo da taxa diária (composta) a partir da taxa anual
  const taxaDiaria = Math.pow(1 + taxaAnual / 100, 1 / 365) - 1;

  // Cálculo do valor bruto com juros compostos com base em dias úteis
  const valorBruto = valor * Math.pow(1 + taxaDiaria, diasUteis);
  const rendimentoBruto = valorBruto - valor;

  // Cálculo do IOF com base em dias corridos
  const diasCorridos = calcularDiasCorridos(dataInicio, hoje); // Calculando os dias corridos para o IOF
  let iof = 0;
  if (diasCorridos < 30) {
    const tabelaIOF = [
      96, 93, 90, 86, 83, 80, 76, 73, 70, 66,
      63, 60, 56, 53, 50, 46, 43, 40, 36, 33,
      30, 26, 23, 20, 16, 13, 10, 6, 3, 0
    ];
    const iofPercent = tabelaIOF[diasCorridos - 1] / 100; // IOF calculado de acordo com os dias corridos
    iof = rendimentoBruto * iofPercent;
  }

  // Imposto de Renda (IR) regressivo
  let irAliquota = 0.225;  // 22,5% para até 180 dias
  if (diasUteis > 720) irAliquota = 0.15;  // 15% acima de 720 dias
  else if (diasUteis > 360) irAliquota = 0.175;  // 17,5% acima de 360 dias
  else if (diasUteis > 180) irAliquota = 0.20;  // 20% acima de 180 dias

  const ir = (rendimentoBruto - iof) * irAliquota;

  // Valor líquido final após descontar IOF e IR
  const valorLiquido = valorBruto - iof - ir;

  return {
    valorBruto,
    valorLiquido,
    rendimentoBruto,
    iof,
    ir,
    dias: diasUteis  // Dias úteis para o cálculo do rendimento
  };
}

// Função para salvar investimentos de Renda Fixa
document.getElementById('salvarRendaFixa').addEventListener('click', function () {
  const tipo = 'rendaFixa';
  const valor = parseFloat(document.getElementById('valorRendaFixa').value);
  const dataAplicacao = new Date(document.getElementById('dataAplicacao').value);
  const dataVencimento = document.getElementById('dataVencimento').value;
  const taxa = parseFloat(document.getElementById('taxaRendaFixa').value); // Ex: 13.65 para Nubank/CDI

  if (isNaN(valor) || isNaN(taxa) || !dataAplicacao || !dataVencimento) {
    alert('Por favor, preencha todos os campos corretamente.');
    return;
  }

  const resultado = calcularRendaFixa(valor, taxa, dataAplicacao);

  // Armazenando o investimento de Renda Fixa
  rendaFixa.push({
    tipo,
    valor,
    dataAplicacao,
    dataVencimento,
    taxa,
    valorLiquido: resultado.valorLiquido,
    rendimentoBruto: resultado.rendimentoBruto,
    iof: resultado.iof,
    ir: resultado.ir,
    dias: resultado.dias
  });

  alert(`Investimento de Renda Fixa salvo!\nRendimento líquido: R$ ${resultado.valorLiquido.toFixed(2).replace('.', ',')}`);
  salvarInvestimentos();
});

// Função para salvar investimentos de Ações
document.getElementById('salvarAcao').addEventListener('click', function () {
  const acao = document.getElementById('acaoComprada').value;
  const valor = parseFloat(document.getElementById('valorAcao').value);

  if (!acao || isNaN(valor)) {
    alert('Por favor, preencha todos os campos corretamente.');
    return;
  }

  acoes.push({ acao, valor });
  alert(`Ação ${acao} comprada por R$ ${valor.toFixed(2).replace('.', ',')}`);
  salvarInvestimentos();
});

// Função para salvar no localStorage e renderizar os investimentos
function salvarInvestimentos() {
  localStorage.setItem('rendaFixa', JSON.stringify(rendaFixa));
  localStorage.setItem('acoes', JSON.stringify(acoes));
  renderizarInvestimentos();
}
// Função para renderizar investimentos
function renderizarInvestimentos() {
  const container = document.getElementById('listaInvestimentos');
  container.innerHTML = ''; // Limpa antes de renderizar
  
  const investimentosRendaFixa = JSON.parse(localStorage.getItem('rendaFixa')) || [];
  const investimentosAcoes = JSON.parse(localStorage.getItem('acoes')) || [];

  investimentosRendaFixa.forEach((inv, index) => {
    const item = document.createElement('div');
    item.className = 'bg-gray-100 p-4 rounded-xl shadow mb-4';
    item.innerHTML = `
      <p><strong>Tipo:</strong> ${inv.tipo}</p>
      <p><strong>Valor:</strong> R$ ${inv.valor.toFixed(2).replace('.', ',')}</p>
      <p><strong>Data Aplicação:</strong> ${new Date(inv.dataAplicacao).toLocaleDateString()}</p>
      <p><strong>Data Vencimento:</strong> ${new Date(inv.dataVencimento).toLocaleDateString()}</p>
      <p><strong>Taxa:</strong> ${inv.taxa}%</p>
      <p><strong>Rendimento Líquido:</strong> R$ ${inv.valorLiquido.toFixed(2).replace('.', ',')}</p>
      <button onclick="excluirInvestimento(${index})" class="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
        Excluir
      </button>
    `;
    container.appendChild(item);
  });

  // Atualiza o gráfico
  atualizarGraficoInvestimentos(investimentosRendaFixa, investimentosAcoes);
}

// Função para atualizar o gráfico de investimentos
function atualizarGraficoInvestimentos(rendaFixa, acoes) {
  const ctx = document.getElementById('graficoInvestimentos');
  if (!ctx) return;

  const totalRendaFixa = rendaFixa.reduce((acc, item) => acc + item.valorLiquido, 0);
  const totalAcoes = acoes.reduce((acc, item) => acc + item.valor, 0);

  if (chartInvestimentos) {
    chartInvestimentos.destroy();
  }

  chartInvestimentos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Renda Fixa', 'Ações'],
      datasets: [
        {
          label: 'Renda Fixa',
          data: [totalRendaFixa],
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
        {
          label: 'Ações',
          data: [totalAcoes],
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => 'R$ ' + value.toLocaleString('pt-BR'),
          }
        }
      }
    }
  });

  console.log("Total Renda Fixa:", totalRendaFixa.toFixed(2));
}

// Função para obter o CDI atual
async function obterCDIAtual() {
  const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados/ultimos/1?formato=json';

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();
    return parseFloat(dados[0].valor.replace(',', '.'));
  } catch (erro) {
    console.error('Erro ao obter CDI:', erro);
    return 13.65; // Valor padrão em caso de erro
  }
}

// Ao carregar a página, renderiza os investimentos
window.addEventListener('load', renderizarInvestimentos);

// Função para recalcular os investimentos diariamente
function atualizarInvestimentosDiariamente() {
  renderizarInvestimentos();  // Atualiza os investimentos e o gráfico com os novos cálculos
}

// Chama a função para recalcular ao carregar a página
window.addEventListener('load', () => {
  renderizarInvestimentos();  // Atualiza os investimentos ao carregar a página
  setInterval(atualizarInvestimentosDiariamente, 24 * 60 * 60 * 1000); // Recalcula a cada 24 horas
});

fetch("/api/transactions/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
  },
  body: JSON.stringify({
    value: 100,
    type: "entrada",
    category_id: "uuid",
    month: "2025-01-01"
  })
});

if (!localStorage.getItem("token")) {
  location.href = "/login.html";
}

fetch("/api/transactions/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
  },
  body: JSON.stringify({
    value: 150,
    type: "entrada",
    category_id: categoriaId,
    month: "2025-01-01"
  })
});


const token = localStorage.getItem("token");

fetch("/api/transactions/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify({
    valor,
    tipo,
    categoria,
    data
  })
});

fetch("/api/transactions/list", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token")
  }
})
.then(r => r.json())
.then(dados => {
  // renderiza tabela
});

document.addEventListener("DOMContentLoaded", () => {
  carregarTransacoes();
});

async function carregarTransacoes() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const res = await fetch("/api/transactions/list", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const dados = await res.json();

  if (!res.ok) {
    alert("Erro ao carregar dados");
    return;
  }

  // 👇 AQUI você usa "dados" para preencher a tabela
  console.log(dados);

  // exemplo:
  // renderizarTabela(dados);
}
