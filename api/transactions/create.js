
import { pool } from "../_db";
import { auth } from "../_auth";

export default async function handler(req, res) {
  const { userId } = auth(req);
  const { value, type, category_id, month } = req.body;

  await pool.query(
    `INSERT INTO transactions (user_id,category_id,type,value,month)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, category_id, type, value, month]
  );

  res.json({ success: true });
}
