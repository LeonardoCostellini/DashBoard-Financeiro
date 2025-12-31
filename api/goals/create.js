
import { pool } from "../_db";
import { auth } from "../_auth";

export default async function handler(req, res) {
  const { userId } = auth(req);
  const { name, target, current } = req.body;

  await pool.query(
    "INSERT INTO goals (user_id,name,target,current) VALUES ($1,$2,$3,$4)",
    [userId, name, target, current]
  );

  res.json({ success: true });
}
