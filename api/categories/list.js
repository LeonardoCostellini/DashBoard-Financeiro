import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT id, nome, tipo FROM categories ORDER BY nome"
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("CATEGORIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
