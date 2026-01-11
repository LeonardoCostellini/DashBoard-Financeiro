import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // ======================
    // AUTH
    // ======================
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não enviado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // ======================
    // GET
    // ======================
    if (req.method === "GET") {
      const { tipo } = req.query;

      if (!tipo) {
        return res.status(400).json({ error: "Tipo é obrigatório" });
      }

      const { rows } = await pool.query(
        `
        SELECT id, nome, tipo
        FROM user_categories
        WHERE user_id = $1 AND tipo = $2
        ORDER BY nome
        `,
        [userId, tipo]
      );

      return res.status(200).json(rows);
    }

    // ======================
    // POST
    // ======================
    
if (req.method === "POST") {
  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  const { nome, tipo } = body;

  if (!nome || !tipo) {
    return res.status(400).json({ error: "Nome e tipo são obrigatórios" });
  }

  try {
    await pool.query(
      `
      INSERT INTO user_categories (user_id, nome, tipo)
      VALUES ($1, $2, $3)
      `,
      [userId, nome, tipo]
    );

    return res.status(201).json({ success: true });

  } catch (dbErr) {
    // Categoria duplicada (unique constraint)
    if (dbErr.code === "23505") {
      return res.status(409).json({
        error: "Você já possui uma categoria com esse nome e tipo"
      });
    }

    console.error("ERRO POST USER_CATEGORIES:", dbErr);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
