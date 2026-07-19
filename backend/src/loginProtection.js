const rateLimit = require('express-rate-limit');

const DEFAULT_MAX_FAILED_ATTEMPTS = Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS || 5);
const DEFAULT_LOCK_WINDOW_SECONDS = Number(process.env.AUTH_LOGIN_LOCK_WINDOW_SECONDS || 15 * 60);
const DEFAULT_IP_WINDOW_MINUTES = Number(process.env.AUTH_LOGIN_IP_WINDOW_MINUTES || 15);
const DEFAULT_IP_MAX_REQUESTS = Number(process.env.AUTH_LOGIN_IP_MAX_REQUESTS || 20);
const LOCK_MESSAGE = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
const ATTEMPT_RETENTION_SECONDS = Math.max(DEFAULT_LOCK_WINDOW_SECONDS * 2, 60 * 60);

const attemptsByLogin = new Map();

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const getNow = () => Date.now();

const cleanupEntryIfExpired = (loginKey, now = getNow()) => {
  const entry = attemptsByLogin.get(loginKey);
  if (!entry) {
    return null;
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.lockedUntil = 0;
    entry.failedAttempts = 0;
  }

  const ageMs = now - (entry.lastFailureAt || 0);
  if (!entry.lockedUntil && entry.failedAttempts === 0 && ageMs > ATTEMPT_RETENTION_SECONDS * 1000) {
    attemptsByLogin.delete(loginKey);
    return null;
  }

  return entry;
};

const getLoginBlockInfo = (login) => {
  const loginKey = normalizeLogin(login);
  if (!loginKey) {
    return null;
  }

  const entry = cleanupEntryIfExpired(loginKey);
  if (!entry || !entry.lockedUntil || entry.lockedUntil <= getNow()) {
    return null;
  }

  return {
    lockedUntil: entry.lockedUntil,
    remainingSeconds: Math.max(1, Math.ceil((entry.lockedUntil - getNow()) / 1000)),
    message: LOCK_MESSAGE,
  };
};

const recordLoginFailure = (login) => {
  const loginKey = normalizeLogin(login);
  if (!loginKey) {
    return null;
  }

  const now = getNow();
  const entry = cleanupEntryIfExpired(loginKey, now) || {
    failedAttempts: 0,
    lockedUntil: 0,
    lastFailureAt: 0,
  };

  entry.failedAttempts += 1;
  entry.lastFailureAt = now;

  if (entry.failedAttempts >= DEFAULT_MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + (DEFAULT_LOCK_WINDOW_SECONDS * 1000);
  }

  attemptsByLogin.set(loginKey, entry);
  return {
    failedAttempts: entry.failedAttempts,
    lockedUntil: entry.lockedUntil,
    isLocked: entry.lockedUntil > now,
    message: LOCK_MESSAGE,
  };
};

const resetLoginFailures = (login) => {
  const loginKey = normalizeLogin(login);
  if (!loginKey) {
    return;
  }

  attemptsByLogin.delete(loginKey);
};

const createLoginIpLimiter = () => {
  return rateLimit({
    windowMs: DEFAULT_IP_WINDOW_MINUTES * 60 * 1000,
    limit: DEFAULT_IP_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: LOCK_MESSAGE },
    handler: (_req, res) => {
      res.status(429).json({ error: LOCK_MESSAGE });
    },
  });
};

module.exports = {
  LOCK_MESSAGE,
  createLoginIpLimiter,
  getLoginBlockInfo,
  recordLoginFailure,
  resetLoginFailures,
  normalizeLogin,
};