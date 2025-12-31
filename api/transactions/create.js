import { Pool } from "pg";
import { getUserId } from "../utils/auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Não autorizado" });

  const { valor, tipo, categoria, data } = req.body;

  await pool.query(
    `INSERT INTO transactions (user_id, valor, tipo, categoria, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, valor, tipo, categoria, data]
  );

  res.json({ success: true });
}
