import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "Sem token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { nome, tipo, origem } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    // =========================
    // CATEGORIA DO USUÁRIO
    // =========================
    if (origem === "usuario") {
      await pool.query(
        `
        INSERT INTO user_categoria (user_id, nome, tipo)
        VALUES ($1, $2, $3)
        `,
        [decoded.userId, nome.trim(), tipo]
      );

      return res.status(201).json({ success: true, origem: "usuario" });
    }

    // =========================
    // CATEGORIA PADRÃO (SISTEMA)
    // =========================
    await pool.query(
      `
      INSERT INTO categories (nome, tipo)
      VALUES ($1, $2)
      `,
      [nome.trim(), tipo]
    );

    return res.status(201).json({ success: true, origem: "padrao" });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Categoria já existe" });
    }

    console.error("CATEGORY CREATE ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
