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
  if (!userId) {
    return res.status(401).json({ error: "Sem token" });
  }

  // 🔹 LISTAR
  if (req.method === "GET") {
    const { rows } = await pool.query(
      "SELECT id, nome, tipo FROM categorias WHERE user_id = $1 ORDER BY nome",
      [userId]
    );
    return res.status(200).json(rows);
  }

  // 🔹 CRIAR
  if (req.method === "POST") {
    const { nome, tipo } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const { rows } = await pool.query(
      `INSERT INTO categorias (user_id, nome, tipo)
       VALUES ($1, $2, $3)
       RETURNING id, nome, tipo`,
      [userId, nome, tipo]
    );

    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: "Método não permitido" });
}
