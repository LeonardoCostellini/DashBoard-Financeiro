import jwt from "jsonwebtoken";

export function auth(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw "Sem token";

  return jwt.verify(token, process.env.JWT_SECRET);
}
