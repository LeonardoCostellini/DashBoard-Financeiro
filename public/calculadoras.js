// ===================================
// FUNÇÕES AUXILIARES
// ===================================

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    });
}

function abrirCalculadora(tipo) {
    const modalId = {
        'jurosCompostos': 'modalJurosCompostos',
        'jurosSimples': 'modalJurosSimples',
        'primeiroMilhao': 'modalPrimeiroMilhao',
        'cdi': 'modalCDI',
        'reservaEmergencia': 'modalReservaEmergencia',
        'porcentagem': 'modalPorcentagem'
    }[tipo];

    if (modalId) {
        document.getElementById(modalId).classList.add('show');
        lucide.createIcons();
    }
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-calculadora') && e.target.classList.contains('show')) {
        e.target.classList.remove('show');
    }
});

// ===================================
// CALCULADORA DE JUROS COMPOSTOS
// ===================================

function calcularJurosCompostos(event) {
    event.preventDefault();

    const valorInicial = parseFloat(document.getElementById('valorInicialCompostos').value);
    const aporteMensal = parseFloat(document.getElementById('aporteMensalCompostos').value);
    const taxaAnual = parseFloat(document.getElementById('taxaJurosCompostos').value);
    const anos = parseInt(document.getElementById('periodoCompostos').value);

    const taxaMensal = taxaAnual / 12 / 100;
    const meses = anos * 12;

    let montante = valorInicial;
    let totalInvestido = valorInicial;
    let totalJuros = 0;

    for (let i = 0; i < meses; i++) {
        montante = montante * (1 + taxaMensal) + aporteMensal;
        totalInvestido += aporteMensal;
    }

    totalJuros = montante - totalInvestido;

    const resultado = document.getElementById('resultadoJurosCompostos');
    resultado.style.display = 'block';
    resultado.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-green-700">📊 Resultado da Simulação</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Total Investido</p>
                <p class="text-2xl font-bold text-blue-700">${formatarMoeda(totalInvestido)}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Total de Juros</p>
                <p class="text-2xl font-bold text-green-700">${formatarMoeda(totalJuros)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Montante Final</p>
                <p class="text-2xl font-bold text-yellow-700">${formatarMoeda(montante)}</p>
            </div>
        </div>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-700">
                <strong>Em ${anos} anos,</strong> seu investimento inicial de ${formatarMoeda(valorInicial)} 
                com aportes mensais de ${formatarMoeda(aporteMensal)} renderá 
                <strong class="text-green-600">${formatarMoeda(totalJuros)}</strong> em juros, 
                totalizando <strong class="text-blue-600">${formatarMoeda(montante)}</strong>.
            </p>
        </div>
    `;
}

// ===================================
// CALCULADORA DE JUROS SIMPLES
// ===================================

function calcularJurosSimples(event) {
    event.preventDefault();

    const valorInicial = parseFloat(document.getElementById('valorInicialSimples').value);
    const taxaAnual = parseFloat(document.getElementById('taxaJurosSimples').value);
    const anos = parseInt(document.getElementById('periodoSimples').value);

    const juros = valorInicial * (taxaAnual / 100) * anos;
    const montante = valorInicial + juros;

    const resultado = document.getElementById('resultadoJurosSimples');
    resultado.style.display = 'block';
    resultado.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-blue-700">📊 Resultado da Simulação</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Valor Inicial</p>
                <p class="text-2xl font-bold text-blue-700">${formatarMoeda(valorInicial)}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Total de Juros</p>
                <p class="text-2xl font-bold text-green-700">${formatarMoeda(juros)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Montante Final</p>
                <p class="text-2xl font-bold text-yellow-700">${formatarMoeda(montante)}</p>
            </div>
        </div>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-700">
                Com juros simples de <strong>${taxaAnual}% ao ano</strong> por <strong>${anos} anos</strong>, 
                seu investimento de ${formatarMoeda(valorInicial)} renderá 
                <strong class="text-green-600">${formatarMoeda(juros)}</strong> em juros, 
                totalizando <strong class="text-blue-600">${formatarMoeda(montante)}</strong>.
            </p>
        </div>
    `;
}

// ===================================
// CALCULADORA PRIMEIRO MILHÃO
// ===================================

function calcularPrimeiroMilhao(event) {
    event.preventDefault();

    const valorInicial = parseFloat(document.getElementById('valorInicialMilhao').value);
    const aporteMensal = parseFloat(document.getElementById('aporteMensalMilhao').value);
    const taxaAnual = parseFloat(document.getElementById('taxaJurosMilhao').value);

    const taxaMensal = taxaAnual / 12 / 100;
    const objetivo = 1000000;

    let montante = valorInicial;
    let totalInvestido = valorInicial;
    let meses = 0;

    while (montante < objetivo && meses < 1200) { // Limite de 100 anos
        montante = montante * (1 + taxaMensal) + aporteMensal;
        totalInvestido += aporteMensal;
        meses++;
    }

    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;

    const resultado = document.getElementById('resultadoPrimeiroMilhao');
    resultado.style.display = 'block';

    if (montante >= objetivo) {
        resultado.innerHTML = `
            <h3 class="text-xl font-bold mb-4 text-yellow-700">🎯 Resultado da Simulação</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">Tempo para R$ 1 Milhão</p>
                    <p class="text-2xl font-bold text-yellow-700">${anos} anos e ${mesesRestantes} meses</p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">Total Investido</p>
                    <p class="text-2xl font-bold text-blue-700">${formatarMoeda(totalInvestido)}</p>
                </div>
            </div>
            <div class="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg border-2 border-yellow-400">
                <p class="text-lg font-semibold text-gray-800 mb-2">🎉 Parabéns! Você chegará ao seu primeiro milhão!</p>
                <p class="text-sm text-gray-700">
                    Investindo ${formatarMoeda(aporteMensal)} por mês com uma taxa de ${taxaAnual}% ao ano, 
                    você alcançará <strong class="text-green-600">R$ 1.000.000,00</strong> em 
                    <strong>${anos} anos e ${mesesRestantes} meses</strong>.
                </p>
            </div>
        `;
    } else {
        resultado.innerHTML = `
            <div class="bg-red-50 p-4 rounded-lg border-2 border-red-400">
                <p class="text-lg font-semibold text-red-700 mb-2">⚠️ Meta não alcançada</p>
                <p class="text-sm text-gray-700">
                    Com os valores informados, não será possível atingir R$ 1 milhão em menos de 100 anos. 
                    Considere aumentar o aporte mensal ou buscar investimentos com maior rentabilidade.
                </p>
            </div>
        `;
    }
}

// ===================================
// CALCULADORA DE CDI
// ===================================

function calcularCDI(event) {
    event.preventDefault();

    const valorInvestido = parseFloat(document.getElementById('valorInvestidoCDI').value);
    const percentualCDI = parseFloat(document.getElementById('percentualCDI').value);
    const taxaCDI = parseFloat(document.getElementById('taxaCDI').value);
    const meses = parseInt(document.getElementById('periodoCDI').value);

    const taxaEfetiva = (taxaCDI * percentualCDI / 100) / 100;
    const taxaMensal = Math.pow(1 + taxaEfetiva, 1/12) - 1;

    const montante = valorInvestido * Math.pow(1 + taxaMensal, meses);
    const rendimento = montante - valorInvestido;

    // Cálculo do IR (simplificado)
    let aliquotaIR = 0.225; // 22.5% até 180 dias
    if (meses > 6 && meses <= 12) aliquotaIR = 0.20;
    else if (meses > 12 && meses <= 24) aliquotaIR = 0.175;
    else if (meses > 24) aliquotaIR = 0.15;

    const impostoRenda = rendimento * aliquotaIR;
    const rendimentoLiquido = rendimento - impostoRenda;
    const montanteLiquido = valorInvestido + rendimentoLiquido;

    const resultado = document.getElementById('resultadoCDI');
    resultado.style.display = 'block';
    resultado.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-purple-700">📊 Resultado da Simulação</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Valor Investido</p>
                <p class="text-2xl font-bold text-blue-700">${formatarMoeda(valorInvestido)}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Rendimento Bruto</p>
                <p class="text-2xl font-bold text-green-700">${formatarMoeda(rendimento)}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Imposto de Renda (${(aliquotaIR * 100).toFixed(1)}%)</p>
                <p class="text-2xl font-bold text-red-700">-${formatarMoeda(impostoRenda)}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Montante Líquido</p>
                <p class="text-2xl font-bold text-purple-700">${formatarMoeda(montanteLiquido)}</p>
            </div>
        </div>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-700">
                Investindo ${formatarMoeda(valorInvestido)} em um investimento que rende 
                <strong>${percentualCDI}% do CDI</strong> (${taxaCDI}% ao ano) por <strong>${meses} meses</strong>, 
                você terá um rendimento líquido de <strong class="text-green-600">${formatarMoeda(rendimentoLiquido)}</strong>, 
                totalizando <strong class="text-purple-600">${formatarMoeda(montanteLiquido)}</strong>.
            </p>
        </div>
    `;
}

// ===================================
// CALCULADORA DE RESERVA DE EMERGÊNCIA
// ===================================

function calcularReservaEmergencia(event) {
    event.preventDefault();

    const despesasMensais = parseFloat(document.getElementById('despesasMensais').value);
    const mesesReserva = parseInt(document.getElementById('mesesReserva').value);
    const valorJaGuardado = parseFloat(document.getElementById('valorJaGuardado').value);

    const reservaIdeal = despesasMensais * mesesReserva;
    const faltaGuardar = Math.max(0, reservaIdeal - valorJaGuardado);
    const percentualConcluido = (valorJaGuardado / reservaIdeal) * 100;

    const resultado = document.getElementById('resultadoReservaEmergencia');
    resultado.style.display = 'block';

    let statusColor = 'red';
    let statusText = 'Atenção!';
    if (percentualConcluido >= 100) {
        statusColor = 'green';
        statusText = 'Parabéns! Meta atingida!';
    } else if (percentualConcluido >= 50) {
        statusColor = 'yellow';
        statusText = 'Você está no caminho certo!';
    }

    resultado.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-red-700">🛡️ Resultado da Simulação</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Reserva Ideal (${mesesReserva} meses)</p>
                <p class="text-2xl font-bold text-blue-700">${formatarMoeda(reservaIdeal)}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Valor Já Guardado</p>
                <p class="text-2xl font-bold text-green-700">${formatarMoeda(valorJaGuardado)}</p>
            </div>
        </div>
        
        <div class="mt-4 p-4 bg-${statusColor}-50 rounded-lg border-2 border-${statusColor}-400">
            <p class="text-lg font-semibold text-${statusColor}-700 mb-2">${statusText}</p>
            <div class="w-full bg-gray-200 rounded-full h-6 mb-3">
                <div class="bg-${statusColor}-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold" 
                     style="width: ${Math.min(percentualConcluido, 100)}%">
                    ${percentualConcluido.toFixed(1)}%
                </div>
            </div>
            ${faltaGuardar > 0 ? `
                <p class="text-sm text-gray-700">
                    Você ainda precisa guardar <strong class="text-${statusColor}-600">${formatarMoeda(faltaGuardar)}</strong> 
                    para completar sua reserva de emergência.
                </p>
            ` : `
                <p class="text-sm text-gray-700">
                    Sua reserva de emergência está completa! Continue mantendo esse valor em aplicações seguras e de fácil resgate.
                </p>
            `}
        </div>
        
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-600">
                <strong>💡 Dica:</strong> Recomenda-se ter entre 3 a 6 meses de despesas guardadas para emergências. 
                Profissionais autônomos ou com renda variável devem considerar 6 a 12 meses.
            </p>
        </div>
    `;
}

// ===================================
// CALCULADORA DE PORCENTAGEM
// ===================================

function calcularPorcentagem1(event) {
    event.preventDefault();

    const percentual = parseFloat(document.getElementById('percentualValor').value);
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);

    const resultado = (percentual / 100) * valorTotal;

    document.getElementById('resultadoPorcentagem1').innerHTML = `
        <div class="bg-blue-100 p-3 rounded-lg mt-2">
            <p class="font-semibold text-blue-800">
                ${percentual}% de ${formatarMoeda(valorTotal)} = <span class="text-xl">${formatarMoeda(resultado)}</span>
            </p>
        </div>
    `;
}

function calcularPorcentagem2(event) {
    event.preventDefault();

    const valorParcial = parseFloat(document.getElementById('valorParcial').value);
    const valorTotal = parseFloat(document.getElementById('valorTotalPercent').value);

    const percentual = (valorParcial / valorTotal) * 100;

    document.getElementById('resultadoPorcentagem2').innerHTML = `
        <div class="bg-green-100 p-3 rounded-lg mt-2">
            <p class="font-semibold text-green-800">
                ${formatarMoeda(valorParcial)} é <span class="text-xl">${percentual.toFixed(2)}%</span> de ${formatarMoeda(valorTotal)}
            </p>
        </div>
    `;
}

function calcularPorcentagem3(event) {
    event.preventDefault();

    const valorInicial = parseFloat(document.getElementById('valorInicial').value);
    const valorFinal = parseFloat(document.getElementById('valorFinal').value);

    const variacao = ((valorFinal - valorInicial) / valorInicial) * 100;
    const tipo = variacao >= 0 ? 'Aumento' : 'Redução';
    const cor = variacao >= 0 ? 'green' : 'red';
    const sinal = variacao >= 0 ? '+' : '';

    document.getElementById('resultadoPorcentagem3').innerHTML = `
        <div class="bg-${cor}-100 p-3 rounded-lg mt-2">
            <p class="font-semibold text-${cor}-800">
                ${tipo} de <span class="text-xl">${sinal}${variacao.toFixed(2)}%</span>
            </p>
            <p class="text-sm text-gray-700 mt-1">
                De ${formatarMoeda(valorInicial)} para ${formatarMoeda(valorFinal)}
            </p>
        </div>
    `;
}

// Inicializar ícones quando os modais abrirem
const observers = document.querySelectorAll('.modal-calculadora');
observers.forEach(modal => {
    const observer = new MutationObserver(() => {
        if (modal.classList.contains('show')) {
            lucide.createIcons();
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
});