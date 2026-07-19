📋 LISTA EXATA DE ARQUIVOS PARA PRODUÇÃO - V2.0
═════════════════════════════════════════════════════════════════════════════

Data: 14 de julho de 2026
Versão: 2.0 (Dois Salões)
Status: ✅ Pronto para Deploy

═════════════════════════════════════════════════════════════════════════════
🔴 BACKEND - ARQUIVOS PARA UPLOAD
═════════════════════════════════════════════════════════════════════════════

ARQUIVO: backend/src/server.js
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~1.5 KB
DESCRIÇÃO: Arquivo principal do servidor

ARQUIVO: backend/src/database.js
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~8.5 KB
DESCRIÇÃO: Schema com tipo_salao, 7 profissionais, 18 serviços

ARQUIVO: backend/src/routes/agenda.js
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~3.2 KB
DESCRIÇÃO: Filtra agendamentos por tipo_salao

ARQUIVO: backend/src/routes/profissionais.js
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~1.8 KB
DESCRIÇÃO: Filtra profissionais por tipo_salao

ARQUIVO: backend/src/routes/servicos.js
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~2.1 KB
DESCRIÇÃO: Filtra serviços por tipo_salao

ARQUIVO: backend/src/routes/dashboard.js
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~2.8 KB
DESCRIÇÃO: Dashboard separado por tipo_salao

ARQUIVO: backend/package.json
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~0.4 KB
DESCRIÇÃO: Dependências: express, cors, sqlite3, uuid

BANCO DE DADOS (SERÁ CRIADO AUTOMATICAMENTE):
ARQUIVO: backend/data/cabeleireiro.db
STATUS: ⚠️ DELETAR ANTIGO ANTES DE EXECUTAR
AÇÃO: Será recriado automaticamente com dados V2.0
TAMANHO: ~12 KB (após criação)
DESCRIÇÃO: SQLite com schema tipo_salao

═════════════════════════════════════════════════════════════════════════════
🔵 FRONTEND - ARQUIVOS PARA UPLOAD (BUILD)
═════════════════════════════════════════════════════════════════════════════

ARQUIVO: frontend/src/App.jsx
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~1.2 KB
DESCRIÇÃO: Estado tipoSalao adicionado

ARQUIVO: frontend/src/components/Navbar.jsx
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~2.4 KB
DESCRIÇÃO: Seletor visual de salão (botões)

ARQUIVO: frontend/src/pages/Dashboard.jsx
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~3.1 KB
DESCRIÇÃO: Dashboard filtra por tipoSalao

ARQUIVO: frontend/src/pages/Agenda.jsx
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~4.2 KB
DESCRIÇÃO: Agenda filtra por tipoSalao

ARQUIVO: frontend/src/pages/Precos.jsx
STATUS: ✅ MODIFICADO - V2.0
TAMANHO: ~3.8 KB
DESCRIÇÃO: Preços filtra por tipoSalao

ARQUIVO: frontend/src/index.css
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~0.8 KB
DESCRIÇÃO: Estilos globais

ARQUIVO: frontend/src/main.jsx
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~0.3 KB
DESCRIÇÃO: Entry point React

ARQUIVO: frontend/package.json
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~0.5 KB
DESCRIÇÃO: Dependências: react, vite, tailwind, axios

ARQUIVO: frontend/vite.config.js
STATUS: ✅ Sem alterações (compatível)
TAMANHO: ~0.3 KB
DESCRIÇÃO: Configuração Vite

═════════════════════════════════════════════════════════════════════════════
📦 PARA PRODUÇÃO - ARQUIVOS FINAIS
═════════════════════════════════════════════════════════════════════════════

BACKEND PASTA:
backend/
├── src/
│   ├── server.js ........................ [UPLOAD]
│   ├── database.js ..................... [UPLOAD] ⭐ MODIFICADO
│   └── routes/
│       ├── agenda.js .................. [UPLOAD] ⭐ MODIFICADO
│       ├── profissionais.js ........... [UPLOAD] ⭐ MODIFICADO
│       ├── servicos.js ............... [UPLOAD] ⭐ MODIFICADO
│       └── dashboard.js .............. [UPLOAD] ⭐ MODIFICADO
├── package.json ........................ [UPLOAD]
├── package-lock.json ................... [UPLOAD - SE EXISTIR]
└── data/
    └── cabeleireiro.db ............... [DELETAR ANTES]

FRONTEND PASTA (BUILD):
frontend/dist/*
├── index.html .......................... [UPLOAD - após npm run build]
├── assets/
│   ├── index-*.js ..................... [UPLOAD - após npm run build]
│   └── index-*.css ................... [UPLOAD - após npm run build]

═════════════════════════════════════════════════════════════════════════════
⚙️ CHECKLIST DE DEPLOYMENT
═════════════════════════════════════════════════════════════════════════════

Antes do Upload:
[ ] Todos 6 arquivos backend em src/ estão preparados
[ ] Todos 5 arquivos frontend em src/ estão preparados
[ ] package.json de ambas pastas incluídos
[ ] DELETE cabeleireiro.db antigo (banco será recriado)
[ ] node_modules não incluído (npm install fará download)

Durante o Upload:
[ ] Fazer upload de backend/src/*
[ ] Fazer upload de backend/package.json
[ ] Fazer upload de frontend/dist/* (após npm run build)
[ ] NÃO fazer upload de node_modules/

Depois do Upload (Servidor):
[ ] npm install (na pasta backend)
[ ] npm run dev (na pasta backend)
[ ] Banco de dados cabeleireiro.db será criado automaticamente
[ ] npm install (na pasta frontend)
[ ] npm run build (na pasta frontend)
[ ] Servir frontend/dist/* via nginx ou similar

═════════════════════════════════════════════════════════════════════════════
📊 RESUMO DAS MODIFICAÇÕES
═════════════════════════════════════════════════════════════════════════════

MODIFICAÇÕES BACKEND:
✏️ database.js
   - ALTER: profissionais (+ tipo_salao)
   - ALTER: servicos (+ tipo_salao)
   - ALTER: agendamentos (+ tipo_salao)
   - ALTER: INSERT dados de 7 profissionais (3M + 4F)
   - ALTER: INSERT dados de 18 serviços (6M + 12F)

✏️ agenda.js
   - ALTER: GET filtra por tipo_salao
   - ALTER: POST inclui tipo_salao

✏️ profissionais.js
   - ALTER: GET filtra por tipo_salao
   - ALTER: POST inclui tipo_salao

✏️ servicos.js
   - ALTER: GET filtra por tipo_salao
   - ALTER: POST inclui tipo_salao

✏️ dashboard.js
   - ALTER: /dia filtra por tipo_salao
   - ALTER: /mes filtra por tipo_salao

MODIFICAÇÕES FRONTEND:
✏️ App.jsx
   - ADD: const [tipoSalao, setTipoSalao] = useState('masculino')
   - ALTER: Passar tipoSalao para componentes

✏️ Navbar.jsx
   - ADD: Seletor de salão (2 botões)
   - ADD: Cores (blue/pink)

✏️ Dashboard.jsx, Agenda.jsx, Precos.jsx
   - ADD: Receber tipoSalao prop
   - ALTER: Passar ?tipo_salao= em requests

═════════════════════════════════════════════════════════════════════════════
🔄 SCRIPT DE DEPLOYMENT (EXEMPLO)
═════════════════════════════════════════════════════════════════════════════

#!/bin/bash
# Deploy script (Linux/Mac)

echo "Deploying Barbershop System V2.0..."

# Backend
cd backend
echo "Installing backend dependencies..."
npm install
echo "Backend ready!"

# Frontend
cd ../frontend
echo "Installing frontend dependencies..."
npm install
echo "Building frontend..."
npm run build
echo "Frontend built!"

echo "✅ Deployment complete!"
echo "Start backend: cd backend && npm run dev"
echo "Start frontend: cd frontend && npm run dev"

═════════════════════════════════════════════════════════════════════════════
📝 NOTAS IMPORTANTES
═════════════════════════════════════════════════════════════════════════════

1. ⚠️ CRITICAL: Delete backend/data/cabeleireiro.db ANTES de primeira execução
   Motivo: Novo schema com tipo_salao precisa ser criado

2. 📦 npm install necessário em ambas pastas (instala dependências)

3. 🔌 Portas:
   - Backend: 3001 (configurable in server.js)
   - Frontend: 3000 (configurable in vite.config.js)

4. 🗄️ Banco de dados:
   - Tipo: SQLite3
   - Local: backend/data/cabeleireiro.db
   - Auto-popula com 7 profissionais + 18 serviços

5. 🔐 CORS:
   - Habilitado entre localhost:3000 e localhost:3001
   - Ajustar URLs em produção se necessário

6. 📊 Dados iniciais:
   - Masculino: 3 profissionais, 6 serviços
   - Feminino: 4 profissionais, 12 serviços (incl. manicure/pedicure)

═════════════════════════════════════════════════════════════════════════════
✅ TOTAL DE ARQUIVOS PARA UPLOAD
═════════════════════════════════════════════════════════════════════════════

Backend Source Files:   6 arquivos em src/ (5 modificados)
Frontend Source Files:  5 arquivos em src/ (5 modificados)
Config Files:           2 arquivos (package.json)
Build Output:           3+ arquivos em frontend/dist/

Total de modifications v1.0 → v2.0: 11 arquivos alterados

═════════════════════════════════════════════════════════════════════════════
🚀 PRONTO PARA PRODUÇÃO!
═════════════════════════════════════════════════════════════════════════════

Versão V2.0 - Dois Salões Completos
Status: ✅ Testado e validado
Data: 14 de julho de 2026
