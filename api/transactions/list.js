import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).end();

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      `
      SELECT id, nome, tipo FROM categories
      UNION ALL
      SELECT id, nome, tipo FROM user_categoria
      WHERE user_id = $1
      ORDER BY nome ASC
      `,
      [decoded.userId]
    );

    return res.status(200).json(rows);

  } catch (err) {
    console.error("CATEGORIES LIST ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
}
