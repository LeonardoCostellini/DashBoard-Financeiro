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
  try {
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const userId = getUserId(req);

    // Se usuário não autenticado, retorna apenas categorias padrão
    if (!userId) {
      const { rows } = await pool.query(
        "SELECT id, nome, tipo FROM categories ORDER BY nome ASC"
      );
      return res.status(200).json(rows);
    }

    // Se autenticado, retorna categorias padrão + categorias do usuário
    const { rows } = await pool.query(
      `
      SELECT id, nome, tipo, 'padrao' as origem FROM categories
      UNION ALL
      SELECT id, nome, tipo, 'usuario' as origem FROM user_categories
      WHERE user_id = $1
      ORDER BY nome ASC
      `,
      [userId]
    );

    return res.status(200).json(rows);

  } catch (err) {
    console.error("CATEGORIES LIST ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
}
