import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Método não permitido" });

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { nome, valor_total } = req.body;

    if (!nome || !valor_total)
      return res.status(400).json({ error: "Dados inválidos" });

    await pool.query(
      "INSERT INTO goals (user_id, nome, valor_total) VALUES ($1, $2, $3)",
      [decoded.userId, nome, valor_total]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("CREATE GOAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
