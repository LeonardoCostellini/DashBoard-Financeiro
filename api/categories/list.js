import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { tipo, nome } = req.body;
    if (!tipo || !nome) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    await pool.query(
      `INSERT INTO categories (user_id, tipo, nome)
       VALUES ($1, $2, $3)`,
      [decoded.userId, tipo, nome]
    );

    res.status(201).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
