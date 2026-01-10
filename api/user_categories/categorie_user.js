import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function getUserId(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    // =========================
    // 📌 LISTAR CATEGORIAS
    // GET /api/user_categories/list
    // =========================
if (req.method === "GET") {
  const { rows } = await pool.query(
    `
    SELECT 
      id,
      name AS nome,
      type AS tipo,
      'padrao' AS origem
    FROM categories

    UNION ALL

    SELECT 
      id,
      nome,
      tipo,
      'usuario' AS origem
    FROM user_categories
    WHERE user_id = $1

    ORDER BY nome ASC
    `,
    [userId]
  );

  return res.status(200).json(rows);
}

    // =========================
    // ➕ CRIAR CATEGORIA
    // POST /api/user_categories/create
    // =========================
    if (req.method === "POST") {
      const { nome, tipo } = req.body;

      if (!nome || !tipo) {
        return res.status(400).json({ error: "Nome e tipo são obrigatórios" });
      }

      if (!["entrada", "saida"].includes(tipo)) {
        return res.status(400).json({ error: "Tipo inválido" });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO user_categories (user_id, nome, tipo)
        VALUES ($1, $2, $3)
        RETURNING id, nome, tipo
        `,
        [userId, nome, tipo]
      );

      return res.status(201).json(rows[0]);
    }

    // =========================
    // ✏️ ATUALIZAR CATEGORIA
    // PUT /api/user_categories/update
    // =========================
    if (req.method === "PUT") {
      const { id, nome, tipo } = req.body;

      if (!id || !nome || !tipo) {
        return res.status(400).json({ error: "ID, nome e tipo são obrigatórios" });
      }

      const { rows } = await pool.query(
        `
        UPDATE user_categories
        SET nome = $1, tipo = $2
        WHERE id = $3 AND user_id = $4
        RETURNING id, nome, tipo
        `,
        [nome, tipo, id, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      return res.status(200).json(rows[0]);
    }

    // =========================
    // 🗑️ DELETAR CATEGORIA
    // DELETE /api/user_categories/delete?id=1
    // =========================
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      const { rowCount } = await pool.query(
        `
        DELETE FROM user_categories
        WHERE id = $1 AND user_id = $2
        `,
        [id, userId]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      return res.status(200).json({ success: true });
    }

    // =========================
    // ❌ MÉTODO INVÁLIDO
    // =========================
    return res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error("CATEGORIE_USER ERROR:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
