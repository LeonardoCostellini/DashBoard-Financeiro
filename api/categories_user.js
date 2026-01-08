import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

function getUserId(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Sem token");
  return jwt.verify(token, process.env.JWT_SECRET).userId;
}

export default async function handler(req, res) {
  try {
    const userId = getUserId(req);

    // 🔍 LISTAR (padrão + usuário)
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT nome, tipo FROM categories
        UNION ALL
        SELECT nome, tipo FROM user_categories
        WHERE user_id = ${userId}
        ORDER BY nome
      `;
      return res.status(200).json(rows);
    }

    // ➕ CRIAR CATEGORIA DO USUÁRIO
    if (req.method === "POST") {
      const { nome, tipo } = req.body;
      if (!nome || !tipo)
        return res.status(400).json({ error: "Dados inválidos" });

      await sql`
        INSERT INTO user_categories (user_id, nome, tipo)
        VALUES (${userId}, ${nome}, ${tipo})
      `;

      return res.status(201).json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
