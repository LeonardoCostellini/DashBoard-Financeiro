import db from "./db.js";
import { verifyToken } from "./utils/auth.js";

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);

    // =======================
    // LISTAR
    // =======================
    if (req.method === "GET") {
      const { tipo } = req.query;

      const result = await db.query(
        `
        SELECT id, nome, tipo
        FROM user_categories
        WHERE user_id = $1 AND tipo = $2
        ORDER BY nome
        `,
        [user.id, tipo]
      );

      return res.status(200).json(result.rows);
    }

    // =======================
    // CRIAR
    // =======================
    if (req.method === "POST") {
      const { nome, tipo } = req.body;

      if (!nome || !tipo) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const exists = await db.query(
        `
        SELECT 1
        FROM user_categories
        WHERE user_id = $1 AND nome = $2 AND tipo = $3
        `,
        [user.id, nome, tipo]
      );

      if (exists.rowCount > 0) {
        return res.status(400).json({ error: "Categoria já existe" });
      }

      await db.query(
        `
        INSERT INTO user_categories (user_id, nome, tipo)
        VALUES ($1, $2, $3)
        `,
        [user.id, nome, tipo]
      );

      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Não autorizado" });
  }
}
