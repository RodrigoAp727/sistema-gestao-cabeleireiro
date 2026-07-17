const express = require('express');
const db = require('../database');
const { asyncHandler, validateRequired, validatePositive, normalizeBool } = require('../utils');
const router = express.Router();

// Listar todos
router.get('/', asyncHandler(async (req, res) => {
  const { tipo_salao = 'masculino' } = req.query;
  const servicos = await db.all(
    'SELECT * FROM servicos WHERE ativo = 1 AND tipo_salao = ? ORDER BY preco DESC',
    [tipo_salao]
  );
  res.json(servicos);
}));

// Criar novo
router.post('/', asyncHandler(async (req, res) => {
  const {
    nome,
    preco,
    duracao_minutos,
    tipo_salao = 'masculino',
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
router.put('/:id', asyncHandler(async (req, res) => {
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
      comissao_valor,
      normalizeBool(precisa_auxiliar),
      orientacoes_cliente,
      variacao_preco_json ? JSON.stringify(variacao_preco_json) : null,
      req.params.id,
    ]
  );
  res.json({ ok: true, message: 'Serviço atualizado' });
}));

// Excluir (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  await db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [req.params.id]);
  res.json({ ok: true, message: 'Serviço excluído' });
}));

module.exports = router;
