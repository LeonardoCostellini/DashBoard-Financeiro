
import { pool } from "../_db";
import { auth } from "../_auth";

export default async function handler(req, res) {
  const { userId } = auth(req);

  const result = await pool.query(
    "SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

  res.json(result.rows);
}
