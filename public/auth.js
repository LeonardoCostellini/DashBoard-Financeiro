async function register() {
  await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });

  alert("Conta criada!");
  location.href = "/login.html";
}

async function login() {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });

  if (!res.ok) {
    alert("Login inválido");
    return;
  }

  const data = await res.json();
  localStorage.setItem("token", data.token);

  location.href = "/";
}
