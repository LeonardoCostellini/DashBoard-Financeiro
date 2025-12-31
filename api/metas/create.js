import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).end();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Sem token" });

  const user = jwt.verify(token, process.env.JWT_SECRET);

  const { nome, valor_total } = req.body;

  await sql`
    INSERT INTO metas (user_id, nome, valor_total, valor_atual)
    VALUES (${user.id}, ${nome}, ${valor_total}, 0)
  `;

  res.json({ success: true });
}
