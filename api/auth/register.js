import { pool } from "../_db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 8);

  await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1,$2)",
    [email, hash]
  );

  res.json({ success: true });
}
