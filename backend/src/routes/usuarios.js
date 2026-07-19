const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { requireMasterAdmin, PERFIS_VALIDOS, isMasterAdminLogin } = require('../middleware');
const { asyncHandler, validateMinLength, validateRequired } = require('../utils');

const router = express.Router();

router.use(requireMasterAdmin());

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const validarSenhaSegura = (senha) => {
  validateRequired(senha, 'Senha de acesso');
  validateMinLength(senha, 6, 'Senha de acesso');
};

router.get('/', asyncHandler(async (req, res) => {
  const busca = String(req.query?.busca || '').trim().toLowerCase();

  const usuarios = await db.all(
    `SELECT
       u.id,
       u.nome,
       u.login,
       u.perfil,
       u.profissional_id,
       u.ativo,
       u.created_at,
       u.updated_at,
       u.last_login_at,
       p.nome as profissional_nome
     FROM sistema_usuarios u
     LEFT JOIN profissionais p ON p.id = u.profissional_id
     WHERE (? = '' OR lower(u.nome) LIKE ? OR lower(u.login) LIKE ?)
     ORDER BY u.ativo DESC, u.nome ASC`,
    [busca, `%${busca}%`, `%${busca}%`]
  );

  res.json(usuarios);
}));

router.post('/', asyncHandler(async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  const login = String(req.body?.login || '').trim();
  const loginNormalizado = normalizeLogin(login);
  const perfil = String(req.body?.perfil || '').trim().toLowerCase();
  const senha = String(req.body?.senha || '').trim();
  const profissionalId = req.body?.profissional_id ? Number(req.body.profissional_id) : null;

  validateRequired(nome, 'Nome do usuário');
  validateMinLength(nome, 3, 'Nome do usuário');
  validateRequired(loginNormalizado, 'Login');

  if (!PERFIS_VALIDOS.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido' });
  }

  validarSenhaSegura(senha);

  if (perfil === 'profissional' && (!profissionalId || profissionalId <= 0)) {
    return res.status(400).json({ error: 'Profissional é obrigatório para usuário do perfil profissional' });
  }

  const existe = await db.get('SELECT id FROM sistema_usuarios WHERE lower(login) = lower(?)', [loginNormalizado]);
  if (existe) {
    return res.status(409).json({ error: 'Já existe um usuário com este login' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const result = await db.run(
    `INSERT INTO sistema_usuarios (nome, login, perfil, senha_hash, profissional_id, ativo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [nome, login, perfil, senhaHash, perfil === 'profissional' ? profissionalId : null]
  );

  res.status(201).json({ id: result.id, message: 'Usuário criado com sucesso' });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const usuarioAtual = await db.get('SELECT id, perfil, login FROM sistema_usuarios WHERE id = ?', [id]);
  if (!usuarioAtual) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (isMasterAdminLogin(usuarioAtual.login)) {
    return res.status(400).json({ error: 'Administrador Mestre não pode ser alterado por esta operação' });
  }

  const nome = String(req.body?.nome || '').trim();
  const login = String(req.body?.login || '').trim();
  const loginNormalizado = normalizeLogin(login);
  const perfil = String(req.body?.perfil || '').trim().toLowerCase();
  const senha = req.body?.senha !== undefined
    ? String(req.body?.senha || '').trim()
    : null;
  const ativo = req.body?.ativo ? 1 : 0;
  const profissionalId = req.body?.profissional_id ? Number(req.body.profissional_id) : null;

  validateRequired(nome, 'Nome do usuário');
  validateMinLength(nome, 3, 'Nome do usuário');
  validateRequired(loginNormalizado, 'Login');

  if (!PERFIS_VALIDOS.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido' });
  }

  if (perfil === 'profissional' && (!profissionalId || profissionalId <= 0)) {
    return res.status(400).json({ error: 'Profissional é obrigatório para usuário do perfil profissional' });
  }

  const loginDuplicado = await db.get(
    'SELECT id FROM sistema_usuarios WHERE lower(login) = lower(?) AND id <> ?',
    [loginNormalizado, id]
  );
  if (loginDuplicado) {
    return res.status(409).json({ error: 'Já existe um usuário com este login' });
  }

  if (ativo === 0 && usuarioAtual.perfil === 'administrador') {
    const outrosAdminsAtivos = await db.get(
      `SELECT COUNT(*) as total
       FROM sistema_usuarios
       WHERE perfil = 'administrador' AND ativo = 1 AND id <> ?`,
      [id]
    );

    if (!outrosAdminsAtivos || Number(outrosAdminsAtivos.total) === 0) {
      return res.status(400).json({ error: 'Não é permitido desativar o último administrador ativo' });
    }
  }

  await db.run(
    `UPDATE sistema_usuarios
     SET nome = ?,
         login = ?,
         perfil = ?,
         profissional_id = ?,
         ativo = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nome, login, perfil, perfil === 'profissional' ? profissionalId : null, ativo, id]
  );

  if (senha !== null && senha !== '') {
    validarSenhaSegura(senha);
    const senhaHash = await bcrypt.hash(senha, 10);
    await db.run(
      `UPDATE sistema_usuarios
       SET senha_hash = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [senhaHash, id]
    );
  }

  res.json({ ok: true, message: 'Usuário atualizado com sucesso' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const usuario = await db.get('SELECT id, perfil, login FROM sistema_usuarios WHERE id = ?', [id]);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (isMasterAdminLogin(usuario.login)) {
    return res.status(400).json({ error: 'Administrador Mestre não pode ser desativado' });
  }

  if (usuario.perfil === 'administrador') {
    const outrosAdminsAtivos = await db.get(
      `SELECT COUNT(*) as total
       FROM sistema_usuarios
       WHERE perfil = 'administrador' AND ativo = 1 AND id <> ?`,
      [id]
    );

    if (!outrosAdminsAtivos || Number(outrosAdminsAtivos.total) === 0) {
      return res.status(400).json({ error: 'Não é permitido desativar o último administrador ativo' });
    }
  }

  await db.run(
    `UPDATE sistema_usuarios
     SET ativo = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id]
  );

  res.json({ ok: true, message: 'Usuário desativado com sucesso' });
}));

module.exports = router;
