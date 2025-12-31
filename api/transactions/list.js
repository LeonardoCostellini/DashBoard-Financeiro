import { Pool } from "pg";
import { getUserId } from "../utils/auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Não autorizado" });

  const result = await pool.query(
    "SELECT * FROM transactions WHERE user_id = $1 ORDER BY data DESC",
    [userId]
  );

  res.json(result.rows);
}

