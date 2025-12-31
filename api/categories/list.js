// /api/categories/list.js
import { pool } from "../_db";
import { auth } from "../_auth";

export default async function handler(req, res) {
  const { userId } = auth(req);

  const result = await pool.query(
    "SELECT * FROM categories WHERE user_id=$1",
    [userId]
  );

  res.json(result.rows);
}
