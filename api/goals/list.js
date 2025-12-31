import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(`
      SELECT *,
      ROUND((valor_atual / valor_total) * 100, 2) AS progresso
      FROM goals
      WHERE user_id = $1
    `, [decoded.userId]);

    res.json(result.rows);

  } catch (err) {
    console.error("LIST GOAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
