#!/bin/bash

echo "🧸 =================================="
echo "   TESTANDO SISTEMA AMIGURIMI"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=$3
    local data=$4
    
    echo -n "Testando $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 201 ]; then
        echo -e "${GREEN}✓ PASSOU${NC} (Status: $status_code)"
        echo "   Resposta: $body"
    else
        echo -e "${RED}✗ FALHOU${NC} (Status: $status_code)"
        echo "   Resposta: $body"
    fi
    echo ""
}

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está ativo..."
if curl -s http://localhost:4000/api/categories > /dev/null; then
    echo -e "${GREEN}✓ Servidor está rodando!${NC}"
else
    echo -e "${RED}✗ Servidor não está rodando. Iniciando...${NC}"
    cd /app/AmigurimiWonderland/api
    node server-completo.js > /tmp/server.log 2>&1 &
    sleep 3
fi
echo ""

# Testes
echo "📋 EXECUTANDO TESTES:"
echo "===================="
echo ""

# 1. Teste de Login Válido
test_endpoint "Login Válido" \
    "http://localhost:4000/api/auth" \
    "POST" \
    '{"email":"admin@amigurimi.com","password":"admin123"}'

# 2. Teste de Login Inválido
test_endpoint "Login Inválido" \
    "http://localhost:4000/api/auth" \
    "POST" \
    '{"email":"admin@amigurimi.com","password":"senhaerrada"}'

# 3. Listar Produtos
test_endpoint "Listar Produtos" \
    "http://localhost:4000/api/products" \
    "GET"

# 4. Listar Categorias
test_endpoint "Listar Categorias" \
    "http://localhost:4000/api/categories" \
    "GET"

# Resumo
echo "===================================="
echo "✅ TESTES CONCLUÍDOS!"
echo "===================================="
echo ""
echo "📌 Informações do Sistema:"
echo "   • Servidor: http://localhost:4000"
echo "   • Login: http://localhost:4000/login.html"
echo "   • Email: admin@amigurimi.com"
echo "   • Senha: admin123"
echo ""
echo "🔍 Para ver logs do servidor:"
echo "   tail -f /tmp/server.log"
echo ""
