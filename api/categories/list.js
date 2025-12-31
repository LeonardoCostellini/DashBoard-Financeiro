export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY nome",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
