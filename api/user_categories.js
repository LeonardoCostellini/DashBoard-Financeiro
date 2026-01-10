import db from "./db.js";
import { verifyToken } from "./utils/auth.js";

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);

    if (req.method === "GET") {
      const { tipo } = req.query;

      const result = await db.query(
        `
        SELECT id, nome, tipo
        FROM user_categories
        WHERE user_id = $1 AND tipo = $2
        `,
        [user.id, tipo]
      );

      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { nome, tipo } = req.body;

      await db.query(
        `
        INSERT INTO user_categories (user_id, nome, tipo)
        VALUES ($1, $2, $3)
        `,
        [user.id, nome, tipo]
      );

      return res.status(201).json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Não autorizado" });
  }
}
