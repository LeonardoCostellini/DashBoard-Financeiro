const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const JWT_SECRET = 'secret_key'; // depois mova para .env

// ==========================
// CONEXÃO MONGODB
// ==========================
mongoose.connect('mongodb://localhost:27017/controle_financeiro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado ao MongoDB'))
.catch(err => console.error('❌ Erro MongoDB:', err));

// ==========================
// APP
// ==========================
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// ==========================
// MODEL
// ==========================
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// ==========================
// REGISTER
// ==========================
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

// ==========================
// LOGIN
// ==========================
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // 🔥 JWT COM userId (IMPORTANTE)
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login' });
  }
});

// ==========================
// ME
// ==========================
app.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      userId: decoded.userId,
      username: decoded.username
    });

  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// ==========================
// START
// ==========================
app.listen(port, () => {
  console.log(`🚀 Auth server rodando na porta ${port}`);
});
