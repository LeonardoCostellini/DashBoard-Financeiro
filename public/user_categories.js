// NÃO declare token aqui

// -----------------------
// BUSCAR
// -----------------------
async function getUserCategories(tipo) {
  const res = await fetch(`/api/user_categories?tipo=${tipo}`, {
    headers: {
      Authorization: `Bearer ${window.token}`
    }
  });

  if (!res.ok) return [];
  return await res.json();
}

// -----------------------
// CRIAR
// -----------------------
async function createUserCategory(nome, tipo) {
  const res = await fetch("/api/user_categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.token}`
    },
    body: JSON.stringify({ nome, tipo })
  });

  return res.ok;
}
