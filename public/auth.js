async function register() {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");

  if (!emailInput || !senhaInput) {
    alert("Campos de cadastro não encontrados");
    return;
  }

  const email = emailInput.value;
  const password = senhaInput.value;

  if (!email || !password) {
    alert("Preencha email e senha");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
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
  const email = document.getElementById("email").value;
  const password = document.getElementById("senha").value;

  const res = await fetch("/api/auth/login", {
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
  window.location.href = "/";
}

