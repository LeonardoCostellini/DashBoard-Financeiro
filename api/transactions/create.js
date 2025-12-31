import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Método não permitido" });
      return;
    }

    if (!req.body) {
      res.status(400).json({ error: "Body ausente" });
      return;
    }

    const auth = req.headers.authorization;
    if (!auth) {
      res.status(401).json({ error: "Token ausente" });
      return;
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { valor, tipo, categoria, data } = req.body;

    const valorFinal = Number(valor);
    if (isNaN(valorFinal)) {
      res.status(400).json({ error: "Valor inválido" });
      return;
    }

    if (!tipo || !categoria || !data) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }

    await pool.query(
      `
      INSERT INTO transactions (user_id, valor, tipo, categoria, data)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, valorFinal, tipo, categoria, data]
    );

    res.status(201).json({ success: true });

  } catch (err) {
    console.error("CREATE TRANSACTION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
