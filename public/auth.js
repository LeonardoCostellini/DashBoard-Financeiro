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
  const email = document.getElementById("email").value;
  const password = document.getElementById("senha").value;

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

    const text = await res.text(); // ⬅️ MUDANÇA AQUI
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Resposta não JSON:", text);
      alert("Erro no servidor. Tente novamente.");
      return;
    }

    if (!res.ok) {
      alert(data.error || "Login inválido");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/";

  } catch (err) {
    console.error(err);
    alert("Erro de conexão com o servidor");
  }
}

export default async function handler(req, res) {
  try {
    const { action } = req.query;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    if (action === "login") {
      return res.status(200).json({
        token: "TOKEN_TESTE"
      });
    }

    if (action === "register") {
      return res.status(201).json({
        message: "Usuário criado"
      });
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).json({
      error: "Erro interno no servidor"
    });
  }
}

