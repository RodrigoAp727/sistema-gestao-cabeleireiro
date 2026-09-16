const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { authenticateRequest, errorHandler, validateAuthConfiguration } = require('./middleware');
const authRoutes = require('./routes/auth');
const agendaRoutes = require('./routes/agenda');
const profissionaisRoutes = require('./routes/profissionais');
const servicosRoutes = require('./routes/servicos');
const dashboardRoutes = require('./routes/dashboard');
const clientesRoutes = require('./routes/clientes');
const comandasRoutes = require('./routes/comandas');
const caixaRoutes = require('./routes/caixa');
const estoqueRoutes = require('./routes/estoque');
const relatoriosRoutes = require('./routes/relatorios');
const whatsappRoutes = require('./routes/whatsapp');
const comissoesRoutes = require('./routes/comissoes');
const configRoutes = require('./routes/config');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const allowedOrigins = new Set([
  process.env.CORS_ORIGIN,
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Auth pública
app.use('/api/auth', authRoutes);

// APIs protegidas
app.use('/api', authenticateRequest);
app.use('/api/agenda', agendaRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/comandas', comandasRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/comissoes', comissoesRoutes);
app.use('/api/config', configRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Serve o build do frontend quando presente (deploy single-service)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Middleware de erro global (deve ser o último)
app.use(errorHandler);

// Inicializar banco de dados
db.initialize()
  .then(() => {
    validateAuthConfiguration();
    app.listen(PORT, () => {
      process.stdout.write(`✅ Servidor rodando em http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao inicializar banco de dados:', err);
    process.exit(1);
  });
