# 💈 Barbearia Premium - Sistema de Gestão

Sistema completo para gerenciar uma barbearia com agenda, preços e dashboard de lucros.

## 🚀 Funcionalidades

✅ **Dashboard** - Visualize lucros diários e mensais por serviço e profissional  
✅ **Agenda** - Agende clientes com profissional e serviço específico  
✅ **Tabela de Preços** - Gerencie e visualize todos os serviços oferecidos  
✅ **Interface Moderna** - Design dark mode com visual premium  
✅ **Responsivo** - Funciona em desktop e mobile  

## 📦 Estrutura

```
sistema para cabeleireiro/
├── backend/          # Node.js + Express + SQLite
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js
│   │   └── routes/
│   └── package.json
│
└── frontend/         # React + Tailwind CSS
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   └── App.jsx
    └── package.json
```

## 🛠️ Instalação

### Backend

```bash
cd backend
npm install
npm run dev
```

O servidor estará em `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará em `http://localhost:3000`

## 📋 API Endpoints

### Agenda
- `GET /api/agenda` - Listar agendamentos
- `POST /api/agenda` - Criar novo agendamento
- `PATCH /api/agenda/:id/confirmar` - Confirmar
- `PATCH /api/agenda/:id/cancelar` - Cancelar

### Serviços
- `GET /api/servicos` - Listar serviços
- `POST /api/servicos` - Criar novo serviço
- `PUT /api/servicos/:id` - Atualizar

### Profissionais
- `GET /api/profissionais` - Listar profissionais
- `POST /api/profissionais` - Criar novo
- `PUT /api/profissionais/:id` - Atualizar

### Dashboard
- `GET /api/dashboard/dia` - Lucros de hoje
- `GET /api/dashboard/mes` - Lucros do mês

## 📊 Dados Iniciais

O sistema vem pré-carregado com:
- 3 profissionais de exemplo
- 6 serviços para público masculino
- Preços pré-configurados

## 🎨 Customização

### Alterar nome da barbearia
- Editar em `frontend/src/components/Navbar.jsx` linha 11

### Alterar cores
- Editar `frontend/tailwind.config.js`

### Adicionar novos serviços
- Use a interface em "Preços" ou o endpoint `POST /api/servicos`

## 🚢 Produção

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Servir a pasta 'dist' com um servidor web
```

## 💾 Banco de Dados

O banco SQLite é criado automaticamente em `backend/data/cabeleireiro.db`

Para resetar o banco, simplesmente delete o arquivo e reinicie o servidor.

## 📱 Telas Principais

### Dashboard
- Faturamento total
- Número de agendamentos
- Ticket médio
- Gráfico por serviço
- Gráfico por profissional

### Agenda
- Listar todos os agendamentos
- Agendar novo cliente
- Confirmar agendamento
- Cancelar agendamento

### Preços
- Tabela completa de serviços
- Adicionar novos serviços
- Visualizar preço médio
- Duração de cada serviço

## 🔧 Troubleshooting

**Erro: "Cannot find module"**
- Execute `npm install` no diretório correspondente

**Porta já em uso**
- Backend: mudar em `backend/src/server.js` (padrão 3001)
- Frontend: mudar em `frontend/vite.config.js` (padrão 3000)

**Banco de dados não criado**
- Certifique-se que existe a pasta `backend/data/`
- Se necessário, crie manualmente

---

**Desenvolvido com ❤️ para barbearias modernas**
