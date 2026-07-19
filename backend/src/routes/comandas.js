const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');
const { validateNonNegative, validatePositive, validateRequired } = require('../utils');

const router = express.Router();

router.use(requireRoles(['administrador', 'recepcao']));

const consumirEstoquePorServicos = async (itens = [], tipoSalao = 'feminino') => {
  const avisos = [];

  for (const item of itens) {
    const servicoId = Number(item.servico_id || 0);
    const quantidadeServico = Number(item.quantidade || 1);
    if (!servicoId || quantidadeServico <= 0) {
      continue;
    }

    const insumos = await db.all(
      `SELECT si.estoque_item_id, si.quantidade_consumo,
              ei.nome AS estoque_nome, ei.quantidade AS estoque_atual
       FROM servico_insumos si
       JOIN estoque_itens ei ON ei.id = si.estoque_item_id
       WHERE si.servico_id = ? AND si.ativo = 1 AND ei.ativo = 1 AND ei.tipo_salao = ?`,
      [servicoId, tipoSalao]
    );

    for (const insumo of insumos) {
      const consumoPrevisto = Number(insumo.quantidade_consumo || 0) * quantidadeServico;
      if (consumoPrevisto <= 0) {
        continue;
      }

      const estoqueAtual = Number(insumo.estoque_atual || 0);
      const novaQuantidade = Math.max(estoqueAtual - consumoPrevisto, 0);

      if (estoqueAtual < consumoPrevisto) {
        avisos.push(
          `Estoque insuficiente para ${insumo.estoque_nome}. Consumiu ${estoqueAtual} de ${consumoPrevisto} previsto.`
        );
      }

      await db.run('UPDATE estoque_itens SET quantidade = ? WHERE id = ?', [novaQuantidade, insumo.estoque_item_id]);
    }
  }

  return avisos;
};

const calcularTotais = (itens = [], desconto = 0, sinalPago = 0) => {
  const subtotal = itens.reduce((acc, item) => {
    const quantidade = Number(item.quantidade || 1);
    const valorUnitario = Number(item.valor_unitario || 0);
    return acc + (quantidade * valorUnitario);
  }, 0);

  const valorTotal = Math.max(subtotal - Number(desconto || 0), 0);
  const valorRestante = Math.max(valorTotal - Number(sinalPago || 0), 0);

  return {
    subtotal,
    valorTotal,
    valorRestante,
  };
};

router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const comandas = await db.all(
      `SELECT c.*, p.nome as profissional_nome
       FROM comandas c
       LEFT JOIN profissionais p ON c.profissional_id = p.id
       WHERE c.tipo_salao = ? AND c.ativo = 1
       ORDER BY c.created_at DESC`,
      [tipo_salao]
    );

    res.json(comandas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comanda = await db.get('SELECT * FROM comandas WHERE id = ?', [req.params.id]);
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda nao encontrada' });
    }

    const itens = await db.all('SELECT * FROM comanda_itens WHERE comanda_id = ? ORDER BY id', [req.params.id]);
    const pagamentos = await db.all('SELECT * FROM comanda_pagamentos WHERE comanda_id = ? ORDER BY id DESC', [req.params.id]);

    res.json({ ...comanda, itens, pagamentos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      cliente_id,
      cliente_nome,
      profissional_id,
      auxiliar_nome,
      desconto = 0,
      sinal_pago = 0,
      observacoes,
      tipo_salao = 'feminino',
      itens = [],
    } = req.body;

    if (!cliente_nome || cliente_nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente Ã© obrigatÃ³rio' });
    }

    validateRequired(cliente_nome, 'Nome do cliente');
    validateNonNegative(desconto, 'Desconto');
    validateNonNegative(sinal_pago, 'Sinal pago');

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Informe ao menos um item na comanda' });
    }
    
    for (const item of itens) {
      validateRequired(item.descricao, 'Descrição do item');
      validatePositive(item.valor_unitario, 'Valor unitário');
    }

    const totais = calcularTotais(itens, desconto, sinal_pago);
    const statusInicial = totais.valorRestante === 0 ? 'fechada' : 'aberta';

    const result = await db.run(
      `INSERT INTO comandas
      (cliente_id, cliente_nome, profissional_id, auxiliar_nome, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id || null,
        cliente_nome,
        profissional_id || null,
        auxiliar_nome || null,
        tipo_salao,
        totais.subtotal,
        Number(desconto || 0),
        Number(sinal_pago || 0),
        totais.valorTotal,
        totais.valorRestante,
        statusInicial,
        observacoes || null,
      ]
    );

    for (const item of itens) {
      const quantidade = Number(item.quantidade || 1);
      const valorUnitario = Number(item.valor_unitario || 0);
      const total = quantidade * valorUnitario;
      await db.run(
        `INSERT INTO comanda_itens
         (comanda_id, servico_id, tipo_item, descricao, quantidade, valor_unitario, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          item.servico_id || null,
          item.tipo_item || 'servico',
          item.descricao,
          quantidade,
          valorUnitario,
          total,
        ]
      );
    }

    if (Number(sinal_pago || 0) > 0) {
      await db.run(
        `INSERT INTO comanda_pagamentos (comanda_id, forma_pagamento, valor)
         VALUES (?, ?, ?)`,
        [result.id, 'sinal', Number(sinal_pago)]
      );
    }

    const consumoAvisos = await consumirEstoquePorServicos(itens, tipo_salao);

    res.status(201).json({ id: result.id, message: 'Comanda criada', consumo_avisos: consumoAvisos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagamentos', async (req, res) => {
  try {
    const { forma_pagamento, valor } = req.body;

    validateRequired(forma_pagamento, 'Forma de pagamento');
    validatePositive(valor, 'Valor do pagamento');

    await db.run(
      `INSERT INTO comanda_pagamentos (comanda_id, forma_pagamento, valor)
       VALUES (?, ?, ?)`,
      [req.params.id, forma_pagamento, Number(valor || 0)]
    );

    const totalPagamentos = await db.get(
      `SELECT SUM(valor) as total_pago FROM comanda_pagamentos WHERE comanda_id = ?`,
      [req.params.id]
    );

    const comanda = await db.get('SELECT valor_total FROM comandas WHERE id = ?', [req.params.id]);

    const restante = Math.max(Number(comanda?.valor_total || 0) - Number(totalPagamentos?.total_pago || 0), 0);
    const status = restante === 0 ? 'fechada' : 'aberta';

    await db.run(
      `UPDATE comandas SET valor_restante = ?, status = ? WHERE id = ?`,
      [restante, status, req.params.id]
    );

    res.json({ message: 'Pagamento registrado', valor_restante: restante, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });
    
    const comanda = await db.get('SELECT id FROM comandas WHERE id = ? AND ativo = 1', [id]);
    if (!comanda) return res.status(404).json({ error: 'Comanda nÃ£o encontrada' });
    
    // Soft delete - marca como inativa ao invÃ©s de apagar
    await db.run('UPDATE comandas SET ativo = 0 WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Comanda excluÃ­da' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

