import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    const { valor, tipo, categoria, data } = req.body;

    if (
      typeof valor !== "number" ||
      !tipo ||
      !categoria ||
      !data
    ) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    await pool.query(
      `
      INSERT INTO transactions (user_id, valor, tipo, categoria, data)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, valor, tipo, categoria, data]
    );

    res.status(201).json({ success: true });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
