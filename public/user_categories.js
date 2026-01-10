const token = localStorage.getItem("token");

// -----------------------
// BUSCAR
// -----------------------
async function getUserCategories(tipo) {
  const res = await fetch(`/api/user_categories?tipo=${tipo}`, {
    headers: {
      Authorization: `Bearer ${token}`
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ nome, tipo })
  });

  return res.ok;
}
