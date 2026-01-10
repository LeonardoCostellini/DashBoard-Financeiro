import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ Pool compatível com Serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { acao } = req.query; // login | register
    const { email, password } = req.body || {};

    if (!acao) {
      return res.status(400).json({ error: "Ação não informada" });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha obrigatórios" });
    }

    // =========================
    // 🔐 LOGIN
    // =========================
    if (acao === "login") {
      const result = await pool.query(
        "SELECT id, password FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const user = result.rows[0];
      const senhaOk = await bcrypt.compare(password, user.password);

      if (!senhaOk) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "dev_secret",
        { expiresIn: "7d" }
      );

      return res.status(200).json({ token });
    }

    // =========================
    // 📝 REGISTER
    // =========================
    if (acao === "register") {
      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, hash]
      );

      return res.status(201).json({ success: true });
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (err) {
    console.error("AUTH ERROR:", err);

    // email duplicado
    if (err.code === "23505") {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
