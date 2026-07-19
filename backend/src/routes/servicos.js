const express = require('express');
const db = require('../database');
const { asyncHandler, validateRequired, validatePositive, normalizeBool, normalizeCommission, validateCommission } = require('../utils');
const { requireRoles } = require('../middleware');
const { getPaginationParams, clampPagination, formatPaginatedResponse } = require('../pagination');
const router = express.Router();

// Listar todos
router.get('/', requireRoles(['administrador', 'recepcao', 'profissional']), asyncHandler(async (req, res) => {
  const { tipo_salao = 'feminino' } = req.query;
  const pagination = getPaginationParams(req.query);
  const total = await db.get(
    'SELECT COUNT(*) AS total FROM servicos WHERE ativo = 1 AND tipo_salao = ?',
    [tipo_salao]
  );

  if (!pagination.paginated) {
    const servicos = await db.all(
      'SELECT * FROM servicos WHERE ativo = 1 AND tipo_salao = ? ORDER BY preco DESC',
      [tipo_salao]
    );
    return res.json(servicos);
  }

  const normalized = clampPagination({
    page: pagination.page,
    limit: pagination.limit,
    total: Number(total?.total || 0),
  });

  const servicos = await db.all(
    'SELECT * FROM servicos WHERE ativo = 1 AND tipo_salao = ? ORDER BY preco DESC LIMIT ? OFFSET ?',
    [tipo_salao, normalized.limit, normalized.offset]
  );

  return res.json(formatPaginatedResponse({ items: servicos, pagination: normalized }));
}));

// Criar novo
router.post('/', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  const {
    nome,
    preco,
    duracao_minutos,
    tipo_salao = 'feminino',
    comissao_tipo = 'percentual',
    comissao_valor = null,
    precisa_auxiliar = 0,
    orientacoes_cliente = null,
    variacao_preco_json = null,
  } = req.body;

  validateRequired(nome, 'Nome do serviço');
  validatePositive(preco, 'Preço');
  validatePositive(duracao_minutos, 'Duração');

  const result = await db.run(
    `INSERT INTO servicos
    (nome, preco, duracao_minutos, tipo_salao, comissao_tipo, comissao_valor, precisa_auxiliar, orientacoes_cliente, variacao_preco_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome,
      preco,
      duracao_minutos,
      tipo_salao,
      comissao_tipo,
      comissao_valor,
      normalizeBool(precisa_auxiliar),
      orientacoes_cliente,
      variacao_preco_json ? JSON.stringify(variacao_preco_json) : null,
    ]
  );
  res.status(201).json({ id: result.id });
}));

// Atualizar
router.put('/:id', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  const {
    nome,
    preco,
    duracao_minutos,
    comissao_tipo,
    comissao_valor,
    precisa_auxiliar,
    orientacoes_cliente,
    variacao_preco_json,
  } = req.body;

  validateRequired(nome, 'Nome do serviço');
  validatePositive(preco, 'Preço');
  validatePositive(duracao_minutos, 'Duração');

  const comissaoNormalizada = normalizeCommission(comissao_valor);
  if (comissao_tipo === 'percentual' && !validateCommission(comissaoNormalizada)) {
    throw new Error('Comissão deve estar entre 0 e 100%');
  }

  await db.run(
    `UPDATE servicos
     SET nome = ?, preco = ?, duracao_minutos = ?, comissao_tipo = ?, comissao_valor = ?,
         precisa_auxiliar = ?, orientacoes_cliente = ?, variacao_preco_json = ?
     WHERE id = ?`,
    [
      nome,
      preco,
      duracao_minutos,
      comissao_tipo,
      comissaoNormalizada,
      normalizeBool(precisa_auxiliar),
      orientacoes_cliente,
      variacao_preco_json ? JSON.stringify(variacao_preco_json) : null,
      req.params.id,
    ]
  );
  res.json({ ok: true, message: 'Serviço atualizado' });
}));

// Excluir (soft delete)
router.delete('/:id', requireRoles(['administrador']), asyncHandler(async (req, res) => {
  await db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [req.params.id]);
  res.json({ ok: true, message: 'Serviço excluído' });
}));

module.exports = router;
