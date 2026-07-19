const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const {
  authenticateRequest,
  clearAuthCookie,
  issueAuthToken,
  setAuthCookie,
  PERFIS_VALIDOS,
  isMasterAdminLogin,
} = require('../middleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const login = String(req.body?.login || '').trim().toLowerCase();
  const perfilSolicitado = String(req.body?.perfil || '').trim().toLowerCase();
  const senha = String(req.body?.senha || '').trim();

  if (!login) {
    return res.status(400).json({ error: 'Login é obrigatório' });
  }

  if (!senha) {
    return res.status(400).json({ error: 'Senha é obrigatória' });
  }

  const autenticar = async () => {
    const usuario = await db.get(
      `SELECT id, nome, login, perfil, senha_hash, ativo, profissional_id
       FROM sistema_usuarios
       WHERE lower(login) = lower(?)`,
      [login]
    );

    if (!usuario || Number(usuario.ativo) !== 1) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!PERFIS_VALIDOS.includes(String(usuario.perfil || '').toLowerCase())) {
      return res.status(401).json({ error: 'Perfil inválido para autenticação' });
    }

    if (perfilSolicitado && perfilSolicitado !== String(usuario.perfil || '').toLowerCase()) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, String(usuario.senha_hash || ''));
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { token, expiresAt } = issueAuthToken({
      userId: usuario.id,
      perfil: usuario.perfil,
      nome: usuario.nome,
      login: usuario.login,
      profissionalId: usuario.profissional_id,
    });

    setAuthCookie(res, token);

    await db.run(
      `UPDATE sistema_usuarios
       SET last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [usuario.id]
    );

    return res.json({
      ok: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        perfil: usuario.perfil,
        profissional_id: usuario.profissional_id,
        is_master_admin: isMasterAdminLogin(usuario.login),
      },
      expires_at: expiresAt,
    });
  };

  return autenticar().catch((err) => {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Não foi possível autenticar este perfil' });
  });
});

router.get('/session', authenticateRequest, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.auth.user_id,
      nome: req.auth.nome,
      login: req.auth.login,
      perfil: req.auth.perfil,
      profissional_id: req.auth.profissional_id || null,
      is_master_admin: !!req.auth.is_master_admin,
    },
    expires_at: req.auth.exp,
  });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

module.exports = router;