📋 LISTA EXATA DE ARQUIVOS PARA PRODUÇÃO
═══════════════════════════════════════════════════════════════════════════

VERSÃO FINAL - 14/07/2026

Conforme sua preferência, aqui está a lista completa de arquivos para fazer upload
em produção a cada atualização.

═══════════════════════════════════════════════════════════════════════════
📦 ATUALIZAÇÃO #1: BACKEND (Primeira entrega)
═══════════════════════════════════════════════════════════════════════════

ARQUIVOS PARA UPLOAD:

backend/src/server.js
backend/src/database.js
backend/src/routes/agenda.js
backend/src/routes/profissionais.js
backend/src/routes/servicos.js
backend/src/routes/dashboard.js
backend/package.json

BANCO DE DADOS (criado automaticamente):
backend/data/cabeleireiro.db

TOTAL: 7 arquivos principais + 1 banco


═══════════════════════════════════════════════════════════════════════════
🎨 ATUALIZAÇÃO #2: FRONTEND (Primeira entrega)
═══════════════════════════════════════════════════════════════════════════

ANTES: Executar localmente
$ cd frontend
$ npm run build

ARQUIVOS GERADOS (pasta dist/):
frontend/dist/index.html
frontend/dist/assets/*.js (minificado)
frontend/dist/assets/*.css (minificado)

FAZER UPLOAD: Pasta inteira frontend/dist/

ARQUIVOS FONTE (para referência, não precisa fazer upload):
frontend/src/main.jsx
frontend/src/App.jsx
frontend/src/index.css
frontend/src/components/Navbar.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/Agenda.jsx
frontend/src/pages/Precos.jsx

TOTAL: ~5 arquivos (após build)


═══════════════════════════════════════════════════════════════════════════
🔄 ATUALIZAÇÃO #3 (quando modificar código)
═══════════════════════════════════════════════════════════════════════════

SE MODIFICAR BACKEND:
1. Modifique os arquivos em backend/src/
2. Upload dos arquivos .js modificados
3. Reinicie o servidor: npm start

SE MODIFICAR FRONTEND:
1. Modifique os arquivos em frontend/src/
2. Execute localmente: npm run build
3. Upload da nova pasta frontend/dist/ completa

SE ADICIONAR NOVO SERVIÇO/PROFISSIONAL:
1. Use a interface web (não precisa fazer upload)
2. O banco de dados será atualizado automaticamente


═══════════════════════════════════════════════════════════════════════════
📊 RESUMO FINAL (Checklist de Produção)
═══════════════════════════════════════════════════════════════════════════

AMBIENTE:
[ ] Node.js v18+ instalado no servidor
[ ] npm instalado no servidor
[ ] Pasta backend/ criada no servidor
[ ] Pasta frontend/dist/ servida pelo nginx/apache

BACKEND:
[ ] 7 arquivos .js copiados para backend/src/
[ ] package.json copiado para backend/
[ ] npm install executado no servidor
[ ] Pasta backend/data/ criada com permissões de escrita
[ ] npm start executado (ou PM2/systemd)

FRONTEND:
[ ] npm run build executado localmente
[ ] Pasta dist/ inteira copiada para servidor web
[ ] Servidor web configurado para servir index.html

TESTES:
[ ] Backend respondendo em /api/health
[ ] Frontend carregando em http://seu-dominio.com
[ ] Agendamento funcionando
[ ] Dashboard exibindo dados
[ ] API CORS configurada corretamente


═══════════════════════════════════════════════════════════════════════════
🚀 DEPLOYMENT SCRIPT (Linux)
═══════════════════════════════════════════════════════════════════════════

#!/bin/bash

# Deploy Backend
mkdir -p /opt/cabeleireiro/backend/src
cp backend/src/*.js /opt/cabeleireiro/backend/src/
cp backend/package.json /opt/cabeleireiro/backend/
cd /opt/cabeleireiro/backend
npm install --production
pm2 restart cabeleireiro-api || pm2 start src/server.js --name cabeleireiro-api

# Deploy Frontend
mkdir -p /var/www/cabeleireiro
rm -rf /var/www/cabeleireiro/*
cp -r frontend/dist/* /var/www/cabeleireiro/

echo "✅ Deploy concluído!"


═══════════════════════════════════════════════════════════════════════════
📝 EXEMPLO: Próxima atualização
═══════════════════════════════════════════════════════════════════════════

DATA: 21/07/2026

MODIFICAÇÕES:
- Adicionou página de Profissionais
- Corrigiu layout mobile
- Melhorou performance do dashboard

ARQUIVOS PARA UPLOAD:

BACKEND:
backend/src/routes/profissionais.js (MODIFICADO)

FRONTEND:
1. npm run build (localmente)
2. Upload pasta inteira: frontend/dist/

TOTAL: 1 arquivo backend + 1 pasta frontend


═══════════════════════════════════════════════════════════════════════════
💾 BACKUP (Importante!)
═══════════════════════════════════════════════════════════════════════════

Sempre faça backup antes de atualizar:

$ cp backend/data/cabeleireiro.db backend/data/cabeleireiro.db.backup
$ cp -r frontend/dist frontend/dist.backup


═══════════════════════════════════════════════════════════════════════════
🔍 VERIFICAÇÃO POS-DEPLOY
═══════════════════════════════════════════════════════════════════════════

1. API Health Check:
   curl http://seu-dominio.com:3001/api/health

2. Lista de Serviços:
   curl http://seu-dominio.com:3001/api/servicos

3. Frontend carrega:
   Abra http://seu-dominio.com no navegador

4. Dashboard funciona:
   Vá em http://seu-dominio.com/dashboard

5. Agendamento salva:
   Tente criar um novo agendamento

6. Banco de dados:
   Verifique se backend/data/cabeleireiro.db existe


═══════════════════════════════════════════════════════════════════════════
⚡ QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════

Estrutura de pastas em produção:

/opt/cabeleireiro/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js
│   │   └── routes/
│   ├── data/
│   │   └── cabeleireiro.db
│   └── package.json
└── node_modules/

/var/www/cabeleireiro/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── ...

Nginx config:
location / {
    root /var/www/cabeleireiro;
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://localhost:3001;
}


═══════════════════════════════════════════════════════════════════════════

Qualquer dúvida, consulte:
• README.md
• PRODUCAO.md
• GUIA_VISUAL.txt

Bom deploy! 🚀
