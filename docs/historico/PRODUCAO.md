# 📋 Lista de Arquivos para Produção

## ✅ Arquivos do Backend (para fazer upload)

```
backend/
├── src/
│   ├── server.js
│   ├── database.js
│   └── routes/
│       ├── agenda.js
│       ├── profissionais.js
│       ├── servicos.js
│       └── dashboard.js
├── data/
│   └── cabeleireiro.db (criado automaticamente)
└── package.json
```

**Total: 8 arquivos principais + banco de dados**

---

## ✅ Arquivos do Frontend (para fazer upload)

```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   └── Navbar.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Agenda.jsx
│       └── Precos.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

**Total: 14 arquivos principais**

---

## 🚀 Passos para Produção

### 1️⃣ Build do Frontend
```bash
cd frontend
npm run build
```
Gera pasta `dist/` com arquivos otimizados para produção

### 2️⃣ Deploy

**Opção A - Usar um servidor Node com PM2**
```bash
npm install -g pm2
pm2 start backend/src/server.js --name "cabeleireiro-api"
```

**Opção B - Usar Docker**
Veja seção Docker abaixo

**Opção C - Hosting Externo**
- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify

---

## 🐳 Docker (Opcional)

### backend/Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

### frontend/Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 📦 Checklist Final

- [ ] Backend compilado e testado
- [ ] Frontend buildado (`npm run build`)
- [ ] Banco de dados (cabeleireiro.db) copiado
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS ativo (produção)
- [ ] CORS configurado corretamente
- [ ] Backups agendados
- [ ] Monitoramento ativo

---

**Total de arquivos: 22 arquivos principais**
