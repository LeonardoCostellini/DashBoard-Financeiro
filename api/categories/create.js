// /api/categories/create.js
import { pool } from "../_db";
import { auth } from "../_auth";

export default async function handler(req, res) {
  const { userId } = auth(req);
  const { name, type } = req.body;

  await pool.query(
    "INSERT INTO categories (user_id,name,type) VALUES ($1,$2,$3)",
    [userId, name, type]
  );

  res.json({ success: true });
}
