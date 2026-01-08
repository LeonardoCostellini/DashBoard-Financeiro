import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { rows } = await pool.query(
      "SELECT id, nome, tipo FROM categories ORDER BY nome ASC"
    );

    return res.status(200).json(rows);

  } catch (err) {
    console.error("CATEGORIES LIST ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
}
