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

    const token = req.headers.authorization?.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    const { nome, tipo } = req.body;
    if (!nome || !tipo)
      return res.status(400).json({ error: "Dados inválidos" });

    await pool.query(
      "INSERT INTO categories (user_id, nome, tipo) VALUES ($1, $2, $3)",
      [userId, nome, tipo]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
