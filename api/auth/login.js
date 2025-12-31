import { pool } from "../_db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { email, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (!user.rows.length) {
    return res.status(401).json({ error: "Usuário não existe" });
  }

  const ok = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const token = jwt.sign(
    { userId: user.rows[0].id },
    process.env.JWT_SECRET
  );

  res.json({ token });
}
