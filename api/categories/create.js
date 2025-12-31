import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { nome, tipo } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    await pool.query(
      "INSERT INTO categories (user_id, nome, tipo) VALUES ($1, $2, $3)",
      [decoded.userId, nome, tipo]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
