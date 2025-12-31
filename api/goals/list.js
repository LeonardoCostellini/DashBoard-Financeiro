const result = await pool.query(
  "SELECT *, (valor_atual / valor_total) * 100 AS progresso FROM goals WHERE user_id = $1",
  [userId]
);
