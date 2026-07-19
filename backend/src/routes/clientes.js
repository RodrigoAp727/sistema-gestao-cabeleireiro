const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');
const { asyncHandler, validateMinLength, validateOptionalPhone, validateRequired } = require('../utils');
const { getPaginationParams, clampPagination, formatPaginatedResponse } = require('../pagination');

const router = express.Router();

router.get('/', requireRoles(['administrador', 'recepcao', 'profissional']), asyncHandler(async (req, res) => {
  const { tipo_salao = 'feminino', busca = '' } = req.query;
  const pagination = getPaginationParams(req.query);
  const buscaLike = `%${busca}%`;

  const total = await db.get(
    `SELECT COUNT(*) AS total
     FROM clientes
     WHERE ativo = 1
       AND tipo_salao = ?
       AND (nome LIKE ? OR COALESCE(telefone, '') LIKE ? OR COALESCE(whatsapp, '') LIKE ?)`,
    [tipo_salao, buscaLike, buscaLike, buscaLike]
  );

  if (!pagination.paginated) {
    const clientes = await db.all(
      `SELECT *
       FROM clientes
       WHERE ativo = 1
         AND tipo_salao = ?
         AND (nome LIKE ? OR COALESCE(telefone, '') LIKE ? OR COALESCE(whatsapp, '') LIKE ?)
       ORDER BY nome`,
      [tipo_salao, buscaLike, buscaLike, buscaLike]
    );

    return res.json(clientes);
  }

  const normalized = clampPagination({
    page: pagination.page,
    limit: pagination.limit,
    total: Number(total?.total || 0),
  });

  const clientes = await db.all(
    `SELECT *
     FROM clientes
     WHERE ativo = 1
       AND tipo_salao = ?
       AND (nome LIKE ? OR COALESCE(telefone, '') LIKE ? OR COALESCE(whatsapp, '') LIKE ?)
     ORDER BY nome
     LIMIT ? OFFSET ?`,
    [tipo_salao, buscaLike, buscaLike, buscaLike, normalized.limit, normalized.offset]
  );

  return res.json(formatPaginatedResponse({ items: clientes, pagination: normalized }));
}));

router.post('/', requireRoles(['administrador', 'recepcao']), asyncHandler(async (req, res) => {
  const {
    nome,
    telefone,
    whatsapp,
    data_nascimento,
    observacoes_cabelo,
    alergias,
    historico_quimico,
    formulas_coloracao,
    tipo_salao = 'feminino',
  } = req.body;

  validateRequired(nome, 'Nome do cliente');
  validateMinLength(nome, 3, 'Nome do cliente');

  const telefoneNormalizado = validateOptionalPhone(telefone, 'Telefone');
  const whatsappNormalizado = validateOptionalPhone(whatsapp, 'WhatsApp');

  const result = await db.run(
    `INSERT INTO clientes
    (nome, telefone, whatsapp, data_nascimento, observacoes_cabelo, alergias, historico_quimico, formulas_coloracao, tipo_salao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(nome).trim(),
      telefoneNormalizado,
      whatsappNormalizado,
      data_nascimento || null,
      observacoes_cabelo || null,
      alergias || null,
      historico_quimico || null,
      formulas_coloracao || null,
      tipo_salao,
    ]
  );

  res.status(201).json({ id: result.id, message: 'Cliente criado' });
}));

router.put('/:id', requireRoles(['administrador', 'recepcao']), asyncHandler(async (req, res) => {
  const {
    nome,
    telefone,
    whatsapp,
    data_nascimento,
    observacoes_cabelo,
    alergias,
    historico_quimico,
    formulas_coloracao,
    faltas,
    cancelamentos,
  } = req.body;

  validateRequired(nome, 'Nome do cliente');
  validateMinLength(nome, 3, 'Nome do cliente');

  await db.run(
    `UPDATE clientes
     SET nome = ?, telefone = ?, whatsapp = ?, data_nascimento = ?, observacoes_cabelo = ?,
         alergias = ?, historico_quimico = ?, formulas_coloracao = ?, faltas = ?, cancelamentos = ?
     WHERE id = ?`,
    [
      String(nome).trim(),
      validateOptionalPhone(telefone, 'Telefone'),
      validateOptionalPhone(whatsapp, 'WhatsApp'),
      data_nascimento || null,
      observacoes_cabelo || null,
      alergias || null,
      historico_quimico || null,
      formulas_coloracao || null,
      Number(faltas || 0),
      Number(cancelamentos || 0),
      req.params.id,
    ]
  );

  res.json({ message: 'Cliente atualizado' });
}));

router.get('/:id/detalhe', requireRoles(['administrador', 'recepcao', 'profissional']), asyncHandler(async (req, res) => {
  const cliente = await db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

  const historico = await db.all(
    `SELECT id, data_hora, status, preco, cliente_nome
     FROM agendamentos
     WHERE cliente_id = ?
     ORDER BY data_hora DESC`,
    [req.params.id]
  );

  const servicos = await db.all(
    `SELECT ci.descricao, SUM(ci.quantidade) as quantidade, SUM(ci.total) as total
     FROM comanda_itens ci
     JOIN comandas c ON c.id = ci.comanda_id
     WHERE c.cliente_id = ?
     GROUP BY ci.descricao
     ORDER BY quantidade DESC`,
    [req.params.id]
  );

  const fotos = await db.all('SELECT * FROM cliente_fotos WHERE cliente_id = ? ORDER BY created_at DESC', [req.params.id]);

  res.json({ cliente, historico, servicos, fotos });
}));

// Excluir cliente
router.delete('/:id', requireRoles(['administrador', 'recepcao']), asyncHandler(async (req, res) => {
  await db.run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
  res.json({ message: 'Cliente excluído' });
}));

router.post('/:id/fotos', requireRoles(['administrador', 'recepcao', 'profissional']), asyncHandler(async (req, res) => {
  const { tipo = 'antes', url, descricao = null } = req.body;
  const result = await db.run(
    `INSERT INTO cliente_fotos (cliente_id, tipo, url, descricao)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, tipo, url, descricao]
  );
  res.status(201).json({ id: result.id, message: 'Foto registrada' });
}));

module.exports = router;

