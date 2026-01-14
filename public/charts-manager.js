// =======================
// GERENCIADOR DE GRÁFICOS
// Controla 3 tipos: Barras, Pizza e Linha
// =======================

let chartPizza = null;
let chartLinha = null;
let currentChartType = 'bar';

// =======================
// SELETORES DE GRÁFICO
// =======================
document.addEventListener('DOMContentLoaded', () => {
    const chartButtons = document.querySelectorAll('.chart-selector-btn');
    
    chartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = btn.getAttribute('data-chart');
            switchChart(chartType);
        });
    });
});

function switchChart(type) {
    currentChartType = type;
    
    // Atualiza botões ativos
    document.querySelectorAll('.chart-selector-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-chart') === type) {
            btn.classList.add('active');
        }
    });
    
    // Atualiza containers visíveis
    document.querySelectorAll('.chart-container-item').forEach(container => {
        container.classList.remove('active');
    });
    
    document.getElementById(`chart-${type}-container`).classList.add('active');
    
    // Atualiza o gráfico correspondente
    atualizarGraficosCompletos();
}

// =======================
// GRÁFICO DE PIZZA
// =======================
function atualizarGraficoPizza() {
    const canvas = document.getElementById("graficoPizza");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const mes = document.getElementById('filtro-mes')?.value;
    
    const categorias = {};
    
    transacoes.forEach(t => {
        if (mes && !t.data.startsWith(mes)) return;
        
        if (t.tipo === "saida") { // Apenas saídas para pizza
            if (!categorias[t.categoria]) {
                categorias[t.categoria] = 0;
            }
            categorias[t.categoria] += Number(t.valor);
        }
    });
    
    const labels = Object.keys(categorias);
    const valores = Object.values(categorias);
    
    // Cores vibrantes para cada fatia
    const backgroundColors = [
        'rgba(239, 68, 68, 0.8)',   // Vermelho
        'rgba(251, 146, 60, 0.8)',  // Laranja
        'rgba(251, 191, 36, 0.8)',  // Amarelo
        'rgba(34, 197, 94, 0.8)',   // Verde
        'rgba(59, 130, 246, 0.8)',  // Azul
        'rgba(139, 92, 246, 0.8)',  // Roxo
        'rgba(236, 72, 153, 0.8)',  // Rosa
        'rgba(14, 165, 233, 0.8)',  // Ciano
        'rgba(249, 115, 22, 0.8)',  // Laranja escuro
        'rgba(168, 85, 247, 0.8)',  // Roxo claro
    ];
    
    if (chartPizza) {
        chartPizza.destroy();
    }
    
    chartPizza = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                label: "Gastos por Categoria",
                data: valores,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: 'rgba(26, 35, 50, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        color: '#B0BEC5',
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 35, 50, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#B0BEC5',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(ctx) {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((ctx.parsed / total) * 100).toFixed(1);
                            return ctx.label + ": " + 
                                ctx.parsed.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                }) + ` (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// =======================
// GRÁFICO DE LINHA
// =======================
function atualizarGraficoLinha() {
    const canvas = document.getElementById("graficoLinha");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Agrupa transações por mês
    const mesesData = {};
    
    transacoes.forEach(t => {
        const mes = t.data.substring(0, 7); // YYYY-MM
        
        if (!mesesData[mes]) {
            mesesData[mes] = { entrada: 0, saida: 0 };
        }
        
        if (t.tipo === "entrada") {
            mesesData[mes].entrada += Number(t.valor);
        } else {
            mesesData[mes].saida += Number(t.valor);
        }
    });
    
    // Ordena meses cronologicamente
    const mesesOrdenados = Object.keys(mesesData).sort();
    
    const entradas = mesesOrdenados.map(mes => mesesData[mes].entrada);
    const saidas = mesesOrdenados.map(mes => mesesData[mes].saida);
    const saldos = mesesOrdenados.map(mes => mesesData[mes].entrada - mesesData[mes].saida);
    
    // Formata labels (Jan/2025, Fev/2025, etc)
    const labels = mesesOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mesNum) - 1]}/${ano}`;
    });
    
    if (chartLinha) {
        chartLinha.destroy();
    }
    
    chartLinha = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Entradas",
                    data: entradas,
                    borderColor: "rgba(34, 197, 94, 1)",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "rgba(34, 197, 94, 1)",
                    pointBorderColor: "#FFFFFF",
                    pointBorderWidth: 2
                },
                {
                    label: "Saídas",
                    data: saidas,
                    borderColor: "rgba(239, 68, 68, 1)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "rgba(239, 68, 68, 1)",
                    pointBorderColor: "#FFFFFF",
                    pointBorderWidth: 2
                },
                {
                    label: "Saldo",
                    data: saldos,
                    borderColor: "rgba(255, 193, 7, 1)",
                    backgroundColor: "rgba(255, 193, 7, 0.1)",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "rgba(255, 193, 7, 1)",
                    pointBorderColor: "#FFFFFF",
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        color: '#B0BEC5',
                        font: {
                            size: 13,
                            family: 'Inter, sans-serif'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 35, 50, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#B0BEC5',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ": " +
                                ctx.parsed.y.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#B0BEC5',
                        callback: value =>
                            value.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                minimumFractionDigits: 0
                            })
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#B0BEC5'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// =======================
// ATUALIZAÇÃO COMPLETA
// =======================
function atualizarGraficosCompletos() {
    // Atualiza o gráfico de barras existente
    if (typeof atualizarGrafico === 'function') {
        atualizarGrafico();
    }
    
    // Atualiza gráfico de pizza
    if (currentChartType === 'pie' || currentChartType === 'bar') {
        atualizarGraficoPizza();
    }
    
    // Atualiza gráfico de linha
    if (currentChartType === 'line' || currentChartType === 'bar') {
        atualizarGraficoLinha();
    }
}

// =======================
// INTEGRAÇÃO COM SISTEMA EXISTENTE
// =======================
// Sobrescreve a função original para incluir todos os gráficos
const atualizarGraficoOriginal = window.atualizarGrafico;

window.atualizarGrafico = function() {
    if (atualizarGraficoOriginal) {
        atualizarGraficoOriginal();
    }
    atualizarGraficosCompletos();
};

// Inicializa todos os gráficos após o carregamento
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        atualizarGraficosCompletos();
    }, 1000);
});
