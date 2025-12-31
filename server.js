const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Conectar ao MongoDB (substitua pela sua string de conexão)
mongoose.connect('mongodb://localhost:27017/controle_financeiro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.log('Erro ao conectar ao MongoDB:', err));

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Definindo o modelo do usuário
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

// Rota para registrar um usuário
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Verificar se o usuário já existe
  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }

  // Criptografar a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Salvar o usuário no banco de dados
  const user = new User({ username, password: hashedPassword });
  await user.save();
  
  res.status(201).json({ message: 'Usuário registrado com sucesso' });
});

// Rota de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Verificar se o usuário existe
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // Verificar se a senha está correta
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // Gerar o token JWT
  const token = jwt.sign({ username: user.username }, 'secret_key', { expiresIn: '1h' });

  res.json({ token });
});

// Rota para obter dados do usuário autenticado
app.get('/me', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    res.json({ username: decoded.username });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
