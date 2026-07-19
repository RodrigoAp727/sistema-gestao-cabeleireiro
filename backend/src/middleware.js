const nodeCrypto = require('crypto');
const db = require('./database');

/**
 * MIDDLEWARE DE ERRO GLOBAL
 * Consolida tratamento de erros em um único lugar
 */

const PERFIS_VALIDOS = ['administrador', 'recepcao', 'profissional'];
const AUTH_COOKIE_NAME = 'svs_auth';
const AUTH_TOKEN_TTL_HOURS = Number(process.env.AUTH_TOKEN_TTL_HOURS || 12);
const AUTH_MASTER_LOGIN = String(process.env.AUTH_MASTER_LOGIN || 'Rodrigo Campos').trim().toLowerCase();

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const isMasterAdminLogin = (login) => normalizeLogin(login) === AUTH_MASTER_LOGIN;

const getAuthTokenSecret = () => process.env.AUTH_TOKEN_SECRET || 'dev-only-change-me-now';

const validateAuthConfiguration = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const required = ['AUTH_TOKEN_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variáveis de autenticação ausentes: ${missing.join(', ')}`);
  }
};

const safeCompare = (a, b) => {
  const valueA = Buffer.from(String(a || ''));
  const valueB = Buffer.from(String(b || ''));

  if (valueA.length !== valueB.length) {
    return false;
  }

  return nodeCrypto.timingSafeEqual(valueA, valueB);
};

const signToken = (payload) => {
  return nodeCrypto
    .createHmac('sha256', getAuthTokenSecret())
    .update(payload)
    .digest('base64url');
};

const parseCookies = (cookieHeader = '') => {
  return String(cookieHeader)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex <= 0) {
        return acc;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

const getTokenFromRequest = (req) => {
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[AUTH_COOKIE_NAME] || null;
};

const issueAuthToken = ({ userId, perfil, nome, login, profissionalId = null }) => {
  if (!PERFIS_VALIDOS.includes(String(perfil || '').toLowerCase())) {
    throw new Error('Perfil inválido para emissão de token');
  }

  const parsedUserId = Number(userId);
  if (!parsedUserId || parsedUserId <= 0) {
    throw new Error('Usuário inválido para emissão de token');
  }

  const now = Date.now();
  const expiresAt = now + (AUTH_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const payload = Buffer.from(
    JSON.stringify({
      user_id: parsedUserId,
      perfil: String(perfil).toLowerCase(),
      nome: String(nome || '').trim() || null,
      login: String(login || '').trim().toLowerCase() || null,
      profissional_id: profissionalId ? Number(profissionalId) : null,
      iat: now,
      exp: expiresAt,
    })
  ).toString('base64url');
  const signature = signToken(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  };
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expected = signToken(payload);

  if (!safeCompare(signature, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!PERFIS_VALIDOS.includes(data.perfil)) {
      return null;
    }

    if (!data.user_id || Number(data.user_id) <= 0) {
      return null;
    }

    if (!data.exp || Number(data.exp) < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const buildCookieHeader = (token, maxAgeSeconds) => {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
};

const setAuthCookie = (res, token) => {
  const maxAgeSeconds = Math.max(0, Math.floor(AUTH_TOKEN_TTL_HOURS * 60 * 60));
  res.setHeader('Set-Cookie', buildCookieHeader(token, maxAgeSeconds));
};

const clearAuthCookie = (res) => {
  res.setHeader('Set-Cookie', buildCookieHeader('', 0));
};

const authenticateRequest = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  const auth = verifyAuthToken(token);

  if (!auth) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }

  try {
    const usuario = await db.get(
      `SELECT id, nome, login, perfil, profissional_id, ativo
       FROM sistema_usuarios
       WHERE id = ?`,
      [Number(auth.user_id)]
    );

    if (!usuario || Number(usuario.ativo) !== 1) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    if (normalizeLogin(usuario.login) !== normalizeLogin(auth.login) || String(usuario.perfil || '').toLowerCase() !== String(auth.perfil || '').toLowerCase()) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    req.auth = {
      ...auth,
      nome: usuario.nome,
      login: usuario.login,
      perfil: String(usuario.perfil || '').toLowerCase(),
      profissional_id: usuario.profissional_id ? Number(usuario.profissional_id) : null,
      is_master_admin: isMasterAdminLogin(usuario.login),
    };
    req.perfil = req.auth.perfil;
    next();
  } catch (err) {
    console.error('❌ Erro ao validar sessão:', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const errorHandler = (err, req, res, next) => {
  void next;
  console.error('❌ Erro:', err.message);
  
  // Validação de entrada
  if (err.message && err.message.includes('é obrigatório')) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message && (
    err.message.includes('deve estar entre') ||
    err.message.includes('deve ser maior que') ||
    err.message.includes('deve ter pelo menos')
  )) {
    return res.status(400).json({ error: err.message });
  }

  // Erro de banco de dados
  if (err.message && err.message.includes('UNIQUE')) {
    return res.status(409).json({ error: 'Registro duplicado - nome já existe' });
  }

  // Erro genérico de banco de dados
  if (err.code) {
    return res.status(500).json({ error: 'Erro ao acessar banco de dados' });
  }

  // Erro genérico
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
};

const requireRoles = (rolesPermitidas = []) => {
  const permitidas = new Set(rolesPermitidas.map((r) => String(r).toLowerCase()));

  return (req, res, next) => {
    const perfil = req.auth?.perfil || req.perfil;

    if (!perfil) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    req.perfil = perfil;

    if (!permitidas.has(perfil)) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta área' });
    }

    next();
  };
};

const requireMasterAdmin = () => {
  return (req, res, next) => {
    const login = req.auth?.login;
    const perfil = req.auth?.perfil;

    if (!login || !perfil) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    if (perfil !== 'administrador' || !isMasterAdminLogin(login)) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta área' });
    }

    next();
  };
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
  authenticateRequest,
  issueAuthToken,
  setAuthCookie,
  clearAuthCookie,
  validateAuthConfiguration,
  requireRoles,
  requireMasterAdmin,
  isMasterAdminLogin,
  AUTH_MASTER_LOGIN,
  PERFIS_VALIDOS,
};
