async function register() {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");

  if (!emailInput || !senhaInput) {
    alert("Campos de cadastro não encontrados");
    return;
  }

  const email = emailInput.value.trim();
  const password = senhaInput.value.trim();

  if (!email || !password) {
    alert("Preencha email e senha");
    return;
  }

  try {
    const res = await fetch("/api/auth?action=register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao criar conta");
      return;
    }

    alert("Conta criada com sucesso!");
    window.location.href = "/login.html";

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
}

async function login() {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");

  if (!emailInput || !senhaInput) {
    alert("Campos de login não encontrados");
    return;
  }

  const email = emailInput.value.trim();
  const password = senhaInput.value.trim();

  if (!email || !password) {
    alert("Preencha email e senha");
    return;
  }

  try {
    const res = await fetch("/api/auth?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login inválido");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/index.html";

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
}
