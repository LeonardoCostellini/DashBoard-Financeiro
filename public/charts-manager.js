// =======================
// GERENCIADOR DE GRÁFICOS
// =======================

let chartPizza  = null;
let chartLinha  = null;
let currentChartType = 'bar';
let isUpdating  = false;

// ── Seletores de gráfico ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => switchChart(btn.getAttribute('data-chart')));
  });
});

function switchChart(type) {
  currentChartType = type;
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-chart') === type);
  });
  document.querySelectorAll('.chart-container-item').forEach(c => c.classList.remove('active'));
  document.getElementById(`chart-${type}-container`).classList.add('active');
  atualizarGraficosCompletos();
}

// ── Pizza ─────────────────────────────────
function atualizarGraficoPizza() {
  const canvas = document.getElementById("graficoPizza");
  if (!canvas) return;

  const mes  = document.getElementById('filtro-mes')?.value;
  const cats = {};

  (transacoes || []).forEach(t => {
    if (mes && !t.data.startsWith(mes)) return;
    if (t.tipo === "saida") {
      cats[t.categoria] = (cats[t.categoria] || 0) + Number(t.valor);
    }
  });

  const labels  = Object.keys(cats);
  const valores = Object.values(cats);

  const colors = [
    'rgba(0,200,83,0.8)','rgba(59,130,246,0.8)','rgba(251,191,36,0.8)',
    'rgba(239,68,68,0.8)','rgba(139,92,246,0.8)','rgba(236,72,153,0.8)',
    'rgba(14,165,233,0.8)','rgba(249,115,22,0.8)','rgba(168,85,247,0.8)','rgba(20,184,166,0.8)'
  ];

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  chartPizza = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#1a2332',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: '#B0BEC5', font: { size: 12, family: 'Inter,sans-serif' }, padding: 14, usePointStyle: true }
        },
        tooltip: {
          backgroundColor: '#1a2332', titleColor: '#fff', bodyColor: '#B0BEC5',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12,
          callbacks: {
            label: ctx => {
              const v = ctx.parsed;
              if (typeof v !== 'number') return '';
              const total = ctx.dataset.data.reduce((a,b) => a + b, 0);
              const pct   = ((v / total) * 100).toFixed(1);
              return ctx.label + ": " + v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) + ` (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ── Linha ─────────────────────────────────
function atualizarGraficoLinha() {
  const canvas = document.getElementById("graficoLinha");
  if (!canvas) return;

  const mesesData = {};
  (transacoes || []).forEach(t => {
    const mes = t.data.substring(0, 7);
    if (!mesesData[mes]) mesesData[mes] = { entrada: 0, saida: 0 };
    if (t.tipo === "entrada") mesesData[mes].entrada += Number(t.valor);
    else mesesData[mes].saida += Number(t.valor);
  });

  const meses   = Object.keys(mesesData).sort();
  const mNomes  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const labels  = meses.map(m => { const [a,n] = m.split('-'); return `${mNomes[+n-1]}/${a}`; });
  const entradas = meses.map(m => mesesData[m].entrada);
  const saidas   = meses.map(m => mesesData[m].saida);
  const saldos   = meses.map(m => mesesData[m].entrada - mesesData[m].saida);

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const mkDataset = (label, data, color) => ({
    label, data,
    borderColor: color, backgroundColor: color.replace('1)', '0.08)'),
    borderWidth: 2.5, tension: 0.4, fill: true,
    pointRadius: 4, pointHoverRadius: 6,
    pointBackgroundColor: color, pointBorderColor: '#0a0f1e', pointBorderWidth: 2
  });

  chartLinha = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        mkDataset("Entradas", entradas, 'rgba(0,200,83,1)'),
        mkDataset("Saídas",   saidas,   'rgba(239,68,68,1)'),
        mkDataset("Saldo",    saldos,   'rgba(255,193,7,1)')
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#B0BEC5', font: { size: 12, family: 'Inter,sans-serif' }, usePointStyle: true } },
        tooltip: {
          backgroundColor: '#1a2332', titleColor: '#fff', bodyColor: '#B0BEC5',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12,
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return typeof v === 'number' ? ctx.dataset.label + ": " + v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : '';
            }
          }
        }
      },
      scales: {
        y: {
          ticks: { color:'#78909C', callback: v => typeof v==='number' ? 'R$'+(v>=1000?(v/1000).toFixed(0)+'k':v) : '' },
          grid: { color:'rgba(255,255,255,0.04)' }
        },
        x: { ticks: { color:'#78909C' }, grid: { color:'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

// ── Atualização completa ──────────────────
function atualizarGraficosCompletos() {
  if (isUpdating) return;
  isUpdating = true;
  try {
    if (typeof atualizarGrafico === 'function') atualizarGrafico();
    atualizarGraficoPizza();
    atualizarGraficoLinha();
  } finally { isUpdating = false; }
}

// Sobrescreve atualizarGrafico global para disparar todos
const _origAtualizarGrafico = window.atualizarGrafico;
window.atualizarGrafico = function() {
  if (isUpdating) return;
  isUpdating = true;
  try {
    if (_origAtualizarGrafico) _origAtualizarGrafico();
    atualizarGraficoPizza();
    atualizarGraficoLinha();
  } finally { isUpdating = false; }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { if (typeof atualizarGrafico === 'function') atualizarGrafico(); }, 800);
});
