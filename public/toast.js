// ── TOAST SYSTEM ──────────────────────────
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'check-circle',
    error:   'alert-circle',
    info:    'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:16px;height:16px;flex-shrink:0"></i><span>${msg}</span>`;
  container.appendChild(toast);

  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  setTimeout(() => toast.remove(), 3200);
}

// Substitui alert/confirm globalmente por versões visuais
const _origAlert   = window.alert.bind(window);
const _origConfirm = window.confirm.bind(window);

window.alert = function(msg) {
  const lc = String(msg).toLowerCase();
  if (lc.includes('erro') || lc.includes('inválid') || lc.includes('error') || lc.includes('falh')) {
    showToast(msg, 'error');
  } else if (lc.includes('sucesso') || lc.includes('criada') || lc.includes('atualizada') || lc.includes('excluída') || lc.includes('excluido')) {
    showToast(msg, 'success');
  } else {
    showToast(msg, 'info');
  }
};

// confirm() ainda usa o nativo (precisa do retorno booleano)
// mas poderia ser substituído por modal customizado futuramente
