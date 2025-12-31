import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    // 🔐 AUTH
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "Token ausente" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 🧾 ID
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID não informado" });
    }

    // 🗑️ DELETE
    const result = await pool.query(
      `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
