import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Sem token" });

  const user = jwt.verify(token, process.env.JWT_SECRET);

  const metas = await sql`
    SELECT *,
    ROUND((valor_atual / valor_total) * 100) AS progresso
    FROM metas
    WHERE user_id = ${user.id}
    ORDER BY id DESC
  `;

  res.json(metas.rows);
}
