const express = require('express');
const db = require('../database');
const { asyncHandler, validateRequired, normalizeCommission, validateCommission, normalizeBool } = require('../utils');
const { requireRoles } = require('../middleware');
const { getPaginationParams, clampPagination, formatPaginatedResponse } = require('../pagination');
const router = express.Router();

// Listar todos
router.get('/', requireRoles(['administrador', 'recepcao', 'profissional']), asyncHandler(async (req, res) => {
  const { tipo_salao = 'feminino' } = req.query;
  const pagination = getPaginationParams(req.query);
  const total = await db.get(
    'SELECT COUNT(*) AS total FROM profissionais WHERE ativo = 1 AND tipo_salao = ?',
    [tipo_salao]
  );

  if (!pagination.paginated) {
    const profissionais = await db.all(
      'SELECT * FROM profissionais WHERE ativo = 1 AND tipo_salao = ? ORDER BY nome',
      [tipo_salao]
    );
    return res.json(profissionais);
  }

  const normalized = clampPagination({
    page: pagination.page,
    limit: pagination.limit,
    total: Number(total?.total || 0),
  });

  const profissionais = await db.all(
    'SELECT * FROM profissionais WHERE ativo = 1 AND tipo_salao = ? ORDER BY nome LIMIT ? OFFSET ?',
    [tipo_salao, normalized.limit, normalized.offset]
  );

  return res.json(formatPaginatedResponse({ items: profissionais, pagination: normalized }));
}));

// Criar novo
router.post('/', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  const {
    nome,
    especialidade,
    tipo_salao = 'feminino',
    profissional_fornece_produtos = 0,
    comissao_percentual = null,
    cargo = null,
    horario_trabalho = null,
    salario = null,
    vale_transporte = null,
    bonificacao = null,
    dias_trabalho = null,
    nivel_acesso = 'profissional',
  } = req.body;

  validateRequired(nome, 'Nome do profissional');

  const comissaoNormalizada = normalizeCommission(comissao_percentual);
  if (!validateCommission(comissaoNormalizada)) {
    throw new Error('ComissÃ£o deve estar entre 0 e 100%');
  }

  const result = await db.run(
    `INSERT INTO profissionais
    (nome, especialidade, tipo_salao, profissional_fornece_produtos, comissao_percentual, cargo, horario_trabalho, salario, vale_transporte, bonificacao, dias_trabalho, nivel_acesso)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome,
      especialidade,
      tipo_salao,
      normalizeBool(profissional_fornece_produtos),
      comissaoNormalizada,
      cargo,
      horario_trabalho,
      salario,
      vale_transporte,
      bonificacao,
      dias_trabalho,
      nivel_acesso,
    ]
  );
  res.status(201).json({ id: result.id });
}));

// Atualizar
router.put('/:id', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  const {
    nome,
    especialidade,
    profissional_fornece_produtos,
    comissao_percentual,
    cargo,
    horario_trabalho,
    salario,
    vale_transporte,
    bonificacao,
    dias_trabalho,
    nivel_acesso,
  } = req.body;

  const comissaoNormalizada = normalizeCommission(comissao_percentual);

  await db.run(
    `UPDATE profissionais
     SET nome = ?, especialidade = ?, profissional_fornece_produtos = ?, comissao_percentual = ?,
         cargo = ?, horario_trabalho = ?, salario = ?, vale_transporte = ?, bonificacao = ?, dias_trabalho = ?, nivel_acesso = ?
     WHERE id = ?`,
    [
      nome,
      especialidade,
      normalizeBool(profissional_fornece_produtos),
      comissaoNormalizada,
      cargo,
      horario_trabalho,
      salario,
      vale_transporte,
      bonificacao,
      dias_trabalho,
      nivel_acesso,
      req.params.id,
    ]
  );
  res.json({ ok: true, message: 'Profissional atualizado' });
}));

// Excluir (soft delete)
router.delete('/:id', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  await db.run('UPDATE profissionais SET ativo = 0 WHERE id = ?', [req.params.id]);
  res.json({ ok: true, message: 'Profissional excluÃ­do' });
}));

module.exports = router;

