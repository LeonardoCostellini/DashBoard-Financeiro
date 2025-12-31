import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    // TOKEN
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // BODY
    const { valor, tipo, categoria, data } = req.body;

    if (!valor || !tipo || !categoria || !data) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    await sql`
      INSERT INTO transactions (user_id, valor, tipo, categoria, data)
      VALUES (${userId}, ${valor}, ${tipo}, ${categoria}, ${data})
    `;

    res.status(201).json({ success: true });

  } catch (err) {
    console.error("CREATE TRANSACTION ERROR:", err);
    res.status(500).json({ error: "Erro interno" });
  }
}
