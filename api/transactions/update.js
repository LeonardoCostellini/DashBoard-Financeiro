import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  try {
    const auth = req.headers.authorization;
    if (!auth) {
      res.status(401).json({ error: "Token ausente" });
      return;
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { id, valor, tipo, categoria, data } = req.body;

    if (
      !id ||
      typeof valor !== "number" ||
      !tipo ||
      !categoria ||
      !data
    ) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const result = await pool.query(
      `
      UPDATE transactions 
      SET valor = $1, tipo = $2, categoria = $3, data = $4
      WHERE id = $5 AND user_id = $6
      `,
      [valor, tipo, categoria, data, id, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
