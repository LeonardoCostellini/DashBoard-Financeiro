import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./_utils/db.js";

export default async function handler(req, res) {
  try {
    // =========================
    // 🔐 LOGIN
    // POST /api/auth?action=login
    // =========================
    if (req.method === "POST" && req.query.action === "login") {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const { rows } = await pool.query(
        "SELECT id, password FROM users WHERE email = $1",
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const user = rows[0];
      const senhaOk = await bcrypt.compare(password, user.password);

      if (!senhaOk) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({ token });
    }

    // =========================
    // 📝 REGISTER
    // POST /api/auth?action=register
    // =========================
    if (req.method === "POST" && req.query.action === "register") {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, hash]
      );

      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
