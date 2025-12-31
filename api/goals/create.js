export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Método não permitido" });

    const token = req.headers.authorization?.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    const { nome, valor_total } = req.body;

    await pool.query(
      "INSERT INTO goals (user_id, nome, valor_total) VALUES ($1, $2, $3)",
      [userId, nome, valor_total]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
