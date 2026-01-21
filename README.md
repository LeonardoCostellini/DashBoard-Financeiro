# 🧸 AmigurimiWonderland - Sistema de Gerenciamento

Sistema de gerenciamento administrativo para loja de Amigurumis, desenvolvido com HTML, CSS, JavaScript e banco de dados PostgreSQL (Neon).

## 🚀 Início Rápido

### Pré-requisitos
- Node.js instalado
- Conta no Neon PostgreSQL (já configurado)

### Instalação

1. **Instalar dependências:**
```bash
cd AmigurimiWonderland
npm install
```

2. **Criar administrador padrão no banco:**
```bash
cd api
node setup-admin.js
```

3. **Iniciar o servidor:**
```bash
node server-completo.js
```

4. **Acessar o sistema:**
Abra seu navegador em: `http://localhost:4000`

## 🔐 Credenciais de Acesso

- **Email:** admin@amigurimi.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere essas credenciais após o primeiro acesso!

## 📁 Estrutura do Projeto

```
AmigurimiWonderland/
├── Frontend/              # Interface do usuário
│   ├── login.html        # Página de login
│   ├── dashboard.html    # Painel administrativo
│   ├── index.html        # Página inicial
│   ├── js/               # JavaScript
│   └── css/              # Estilos
│
├── api/                  # Backend/API
│   ├── .env             # Configurações (DATABASE_URL)
│   ├── server.js        # Servidor Express
│   ├── db.js            # Conexão com banco
│   └── routes/          # Rotas da API
│       ├── auth.js      # Autenticação
│       ├── products.js  # Produtos
│       └── categories.js # Categorias
│
└── database/
    └── scheme.sql       # Schema do banco
```

## 🔧 Comandos Úteis

### Iniciar servidor completo (API + Frontend)
```bash
cd api
node server-completo.js
```

### Iniciar apenas API
```bash
cd api
node start.js
```

### Recriar/Atualizar admin padrão
```bash
cd api
node setup-admin.js
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth` - Login de administrador
  ```json
  {
    "email": "admin@amigurimi.com",
    "password": "admin123"
  }
  ```

### Produtos
- `GET /api/products` - Listar todos os produtos
- `POST /api/products` - Criar novo produto
  ```json
  {
    "name": "Amigurumi BT21",
    "description": "Personagem Tata",
    "price": 45.00,
    "stock": 10,
    "image_url": "https://..."
  }
  ```

### Categorias
- `GET /api/categories` - Listar todas as categorias
- `POST /api/categories` - Criar nova categoria
  ```json
  {
    "name": "Personagens BT21",
    "description": "Coleção BT21"
  }
  ```

## 🗄️ Banco de Dados

### Conexão
O sistema está configurado para usar o banco de dados Neon PostgreSQL. A string de conexão está no arquivo `/api/.env`.

### Tabelas

#### admins
```sql
id SERIAL PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
```

#### categories
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL
description TEXT
```

#### products
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL
description TEXT
price NUMERIC(10,2) NOT NULL
stock INT DEFAULT 0
image_url TEXT
category_id INT REFERENCES categories(id)
```

## 🧪 Testar a API

### Teste de Login
```bash
curl -X POST http://localhost:4000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amigurimi.com","password":"admin123"}'
```

### Listar Produtos
```bash
curl http://localhost:4000/api/products
```

### Listar Categorias
```bash
curl http://localhost:4000/api/categories
```

## 🔒 Segurança

⚠️ **Atenção:** 
- O sistema atual armazena senhas em texto plano
- **Recomendação:** Implementar hash de senhas com bcrypt
- Adicionar autenticação JWT para maior segurança
- Não usar em produção sem implementar estas melhorias

## 🐛 Solução de Problemas

### Erro de conexão com banco
1. Verifique se o arquivo `/api/.env` existe
2. Confirme se a DATABASE_URL está correta
3. Teste a conexão: `node setup-admin.js`

### Porta já em uso
Altere a porta no arquivo de inicialização:
```bash
PORT=5000 node server-completo.js
```

### Login não funciona
1. Verifique se o servidor está rodando
2. Confira as credenciais no banco: `node setup-admin.js`
3. Veja os logs do servidor para erros

## 📝 Próximas Melhorias

- [ ] Implementar hash de senhas (bcrypt)
- [ ] Adicionar autenticação JWT
- [ ] Criar CRUD completo de produtos
- [ ] Adicionar upload de imagens
- [ ] Implementar sistema de permissões
- [ ] Adicionar validações no frontend
- [ ] Melhorar tratamento de erros
- [ ] Adicionar testes automatizados

## 📄 Licença

Este projeto é de uso pessoal.

---

**Desenvolvido com ❤️ para AmigurimiWonderland**
