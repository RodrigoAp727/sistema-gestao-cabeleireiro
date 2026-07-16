#!/bin/bash

echo "🔧 Instalando dependências..."

echo "📦 Backend..."
cd backend
npm install

echo "📦 Frontend..."
cd ../frontend
npm install

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Para iniciar o sistema:"
echo "1. Terminal 1 - Backend: cd backend && npm run dev"
echo "2. Terminal 2 - Frontend: cd frontend && npm run dev"
echo ""
echo "Acesse: http://localhost:3000"
