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
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  if (req.method === "GET") {
    const { rows } = await pool.query(
      "SELECT * FROM categorias WHERE user_id = $1 ORDER BY id",
      [userId]
    );
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { nome, tipo } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO categorias (user_id, nome, tipo)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [userId, nome, tipo]
    );

    return res.status(201).json(rows[0]);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    await pool.query(
      "DELETE FROM categorias WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
