# �‍♂️ Sistema de Gestão para Barbearias e Salões

**Plataforma profissional e completa de gestão para barbearias, salões e estúdios de beleza**

![STATUS](https://img.shields.io/badge/STATUS-PRODUCTION%20READY-brightgreen)
![DESENVOLVIMENTO](https://img.shields.io/badge/DESENVOLVIMENTO-COMPLETO-brightgreen)
![REACT](https://img.shields.io/badge/REACT-18.2.0-blue)
![NODE](https://img.shields.io/badge/NODE.JS-24.14.0-green)
![SQLITE](https://img.shields.io/badge/SQLITE-5.1.6-003B57)

---

## 📋 Sobre o Projeto

Sistema de gestão full-stack desenvolvido para automatizar operações completas de barbearias e salões. Com interface intuitiva e moderna, oferece agenda profissional, gestão de clientes, equipe, estoque, financeiro, comissões e relatórios avançados. Pronto para produção com arquitetura robusta, validação completa de dados e design UI/UX premium.

---

## 🏗️ Arquitetura e Modelagem de Dados (Foco DBA)

A base desta aplicação é um banco de dados relacional (SQLite) normalizado. A modelagem foi pensada para garantir integridade, agilidade nas consultas e robustez nas operações críticas. O sistema utiliza soft delete pattern para manter auditoria completa.

**Tabelas Principais:**
- **profissionais** - Equipe com comissões individualizadas
- **servicos** - Catálogo de serviços com preços
- **agenda** - Agendamentos, bloqueios e lista de espera
- **clientes** - Base de clientes com histórico
- **comandas** - Vendas e ordens de serviço
- **caixa_lancamentos** - Financeiro e fluxo de caixa
- **estoque** - Controle de produtos e materiais
- **configuracao** - Settings e comissões padrão

**Padrão Arquitetural:**
```javascript
// Soft Delete Pattern (Auditoria + Compliance)
UPDATE profissionais SET ativo=0 WHERE id = ?;
SELECT * FROM profissionais WHERE ativo=1;

// Validação em todos endpoints
if (!nome || nome.trim() === '') return 400 Bad Request;
if (preco <= 0) return 400 Bad Request;

// Async/Await para integridade transacional
await db.run('BEGIN TRANSACTION');
await db.run('INSERT INTO comanda...');
await db.run('INSERT INTO comanda_itens...');
await db.run('COMMIT');
```

---

## 🎯 Funcionalidades Principais

### 📊 Dashboard Executivo
Visualização em tempo real de:
- Faturamento diário, semanal, mensal
- Agendamentos e cancelamentos
- Comissões a pagar por profissional
- Indicadores KPI por período

### 📅 Agenda Profissional
- Agendamentos com bloqueios de horário
- Lista de espera integrada
- Confirmação via WhatsApp
- Visualização por profissional/serviço

### 👥 Gestão de Clientes
- Cadastro completo com telefone
- Histórico de visitas
- Integração WhatsApp
- Preferências de serviço

### 👨‍💼 Gestão de Equipe
- Perfil de profissionais
- Comissões individualizadas (cascata)
- Performance tracking
- Soft delete com auditoria

### 💰 Operação e Financeiro
- Comandas de venda
- Lançamentos de caixa
- Relatórios financeiros
- Integração de pagamentos

### 📦 Estoque
- Controle de produtos
- Alertas de estoque mínimo
- Entrada/saída de itens
- Histórico de movimentações

### 📱 WhatsApp Central
- Envio de mensagens automáticas
- Confirmação de agendamentos
- Notificações personalizadas

### 📈 Relatórios Avançados
- Análises por período
- Comparativos de desempenho
- Exportação de dados

---

## 💻 Stack Tecnológico

**Backend:**
- Node.js v24.14.0
- Express 4.18.2
- SQLite3 5.1.6
- CORS + UUID

**Frontend:**
- React 18.2.0
- Vite 5.4.21
- Tailwind CSS 3.3.0
- Recharts 2.10.0
- Axios 1.6.0

---

## 🚀 Instalação Rápida

### Backend
```bash
cd backend
npm install
node src/server.js
# Rodando em http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --port 5174
# Rodando em http://localhost:5174
```

---

## 🔒 Controle de Acesso e Segurança

O sistema implementa validação robusta em todos endpoints:

✅ **Validação de Entrada** - POST/PUT com schema validation  
✅ **Tratamento de Erros** - Try-catch em todas operações  
✅ **Soft Delete** - UPDATE ativo=0 (audit trail completo)  
✅ **404 Check** - Verificação de existência antes de DELETE  
✅ **Comissões Seguras** - Cascata: individual > padrão > fallback  

---

## 🎨 Interface de Usuário e Ergonomia

A interface foi desenvolvida com foco em conforto visual e usabilidade:

✅ **Design Moderno** - Navbar responsive, banners profissionais  
✅ **Cores Personalizadas** - Identidade visual clara e atrativa  
✅ **10+ Páginas** - Dashboard, Agenda, Preços, Clientes, Operação, Comissões, Equipe, Estoque, Relatórios, WhatsApp  
✅ **Responsivo** - Mobile, tablet e desktop otimizados  
✅ **Confirmações** - Modais antes de operações críticas  
✅ **Performance** - Vite startup 677ms, bundle otimizado  

---

## 📁 Estrutura do Projeto

```
sistema-gest-o-cabeleireiro/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js
│   │   └── routes/
│   │       ├── profissionais.js
│   │       ├── servicos.js
│   │       ├── agenda.js
│   │       ├── clientes.js
│   │       ├── comandas.js
│   │       ├── caixa.js
│   │       ├── estoque.js
│   │       ├── dashboard.js
│   │       ├── config.js
│   │       └── ...
│   ├── data/
│   │   └── cabeleireiro.db
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## ✅ Auditoria de Arquitetura

Projeto passou por auditoria profissional com **8 correções críticas**:

| Problema | Solução | Status |
|----------|---------|--------|
| Race conditions DB | Async/await sequencial | ✅ FIXED |
| Validação entrada | POST/PUT validation robusto | ✅ FIXED |
| DELETE sem 404 | ID + existence check | ✅ FIXED |
| Soft delete inconsistente | Padronizado ativo=0 | ✅ FIXED |
| API responses | Normalizado {ok: true} | ✅ FIXED |
| Cascade deletes | Implementado inteligente | ✅ FIXED |
| Comissões hardcoded | Leitura dinâmica DB | ✅ FIXED |
| Transaction safety | Promise-based patterns | ✅ FIXED |

---

## 🧪 Testes Validados

✅ Backend inicializa sem race conditions  
✅ Frontend Vite startup 677ms  
✅ DELETE operations com validação 404  
✅ Input validation rejeita valores inválidos  
✅ Soft delete pattern funcionando  
✅ Commission cascade reading DB  
✅ Dashboard metrics corretas  
✅ Zero lag em operações críticas  

---

## 📄 Licença

MIT License - Veja LICENSE para detalhes

---

## 👤 Desenvolvedor

**Rodrigo Aparecido**  
Arquiteto de Soluções | Full-Stack Developer

---

**Sistema Production-Ready • Pronto para Escalar • Profissional** 💎

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
