import pool from "../db.js";
import { auth } from "../auth.js";

export default async function handler(req, res) {
  await new Promise((resolve) => auth(req, res, resolve));

  // ======================
  // LISTAR METAS
  // ======================
  if (req.method === "GET") {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM metas WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      return res.json(rows);
    } catch {
      return res.status(500).json({ error: "Erro ao listar metas" });
    }
  }

  // ======================
  // CRIAR META
  // ======================
  if (req.method === "POST") {
    const { nome, valor_total, valor_atual } = req.body;

    if (!nome || valor_total == null) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO metas (user_id, nome, valor_total, valor_atual)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, nome, valor_total, valor_atual || 0]
      );

      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: "Erro ao criar meta" });
    }
  }

  // ======================
  // ATUALIZAR META
  // ======================
  if (req.method === "PUT") {
    const { id, valor } = req.body;

    if (!id || valor == null) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    try {
      await pool.query(
        `UPDATE metas
         SET valor_atual = valor_atual + $1
         WHERE id = $2 AND user_id = $3`,
        [valor, id, req.user.id]
      );

      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao atualizar meta" });
    }
  }

  // ======================
  // DELETAR META
  // ======================
  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID não informado" });
    }

    try {
      await pool.query(
        "DELETE FROM metas WHERE id = $1 AND user_id = $2",
        [id, req.user.id]
      );

      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao excluir meta" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}