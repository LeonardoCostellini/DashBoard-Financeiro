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
    const userId = decoded.userId || decoded.id; // Suporte para ambos os formatos

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

      await pool.query(
        `
  INSERT INTO user_categories (user_id, nome, tipo)
  VALUES ($1, $2, $3)
  `,
        [userId, nome, tipo]
      );


      return res.status(201).json({ success: true });
    }

    // ======================
    // PUT (Editar)
    // ======================
    if (req.method === "PUT") {
      const body = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

      const { id, nome, tipo } = body;

      if (!id || !nome || !tipo) {
        return res.status(400).json({ error: "ID, nome e tipo são obrigatórios" });
      }

      const result = await pool.query(
        `
        UPDATE user_categories
        SET nome = $1, tipo = $2
        WHERE id = $3 AND user_id = $4
        `,
        [nome, tipo, id, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      return res.status(200).json({ success: true });
    }

    // ======================
    // DELETE (Excluir)
    // ======================
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      const result = await pool.query(
        `
        DELETE FROM user_categories
        WHERE id = $1 AND user_id = $2
        `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error("ERRO USER_CATEGORIES:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
