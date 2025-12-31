import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

// ⚠️ Pool precisa ficar FORA da função (Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  console.log("🔥 CREATE TRANSACTION CHAMADO");

  try {
    // ❌ Método inválido
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    // 🔐 TOKEN
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token ausente" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const userId = decoded.userId;

    // 📦 BODY
    const { valor, tipo, categoria, data } = req.body;

    if (
      typeof valor !== "number" ||
      !tipo ||
      !categoria ||
      !data
    ) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const tipoFinal =
      tipo.toLowerCase() === "entrada" ? "ENTRADA" : "SAIDA";


    // 🧠 INSERT
    await pool.query(
      `
  INSERT INTO transactions (user_id, valor, tipo, categoria, data)
  VALUES ($1, $2, $3, $4, $5)
  `,
      [userId, valorFinal, tipo, categoria, data]
    );


    return res.status(201).json({ success: true });

  } catch (err) {
    console.error("❌ CREATE TRANSACTION ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

const valorFinal = Number(valor);

if (isNaN(valorFinal)) {
  return res.status(400).json({ error: "Valor inválido" });
}
