import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      "SELECT *, (valor_atual/valor_total)*100 AS progresso FROM metas WHERE user_id=$1",
      [decoded.userId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
