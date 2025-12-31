import pkg from "pg";
import jwt from "jsonwebtoken";

const { Pool } = pkg;

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
  } catch (err) {
    console.error("JWT ERROR:", err);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Token inválido" });
    }

    if (req.method === "GET") {
      const { rows } = await pool.query(
        "SELECT * FROM metas WHERE user_id = $1 ORDER BY id DESC",
        [userId]
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { nome, valor_total, valor_atual = 0 } = req.body;

      const { rows } = await pool.query(
        `INSERT INTO metas (user_id, nome, valor_total, valor_atual)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, nome, valor_total, valor_atual]
      );

      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, valor_atual } = req.body;

      await pool.query(
        "UPDATE metas SET valor_atual = $1 WHERE id = $2 AND user_id = $3",
        [valor_atual, id, userId]
      );

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;

      await pool.query(
        "DELETE FROM metas WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error("META API CRASH:", err);
    return res.status(500).json({ error: "Erro interno da API" });
  }
}
