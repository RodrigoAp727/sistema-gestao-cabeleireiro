const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');

const router = express.Router();

router.use(requireRoles(['administrador']));

router.get('/insumos', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const itens = await db.all(
      `SELECT si.id, si.servico_id, si.estoque_item_id, si.quantidade_consumo,
              s.nome AS servico_nome,
              e.nome AS estoque_nome,
              e.quantidade AS estoque_atual
       FROM servico_insumos si
       JOIN servicos s ON s.id = si.servico_id
       JOIN estoque_itens e ON e.id = si.estoque_item_id
       WHERE si.ativo = 1 AND s.ativo = 1 AND e.ativo = 1
         AND s.tipo_salao = ? AND e.tipo_salao = ?
       ORDER BY s.nome, e.nome`,
      [tipo_salao, tipo_salao]
    );
    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/insumos/servico/:servicoId', async (req, res) => {
  try {
    const servicoId = Number(req.params.servicoId);
    const { tipo_salao = 'feminino', insumos = [] } = req.body;

    if (!Number.isInteger(servicoId) || servicoId <= 0) {
      return res.status(400).json({ error: 'Servico invalido' });
    }

    if (!Array.isArray(insumos)) {
      return res.status(400).json({ error: 'Formato de insumos invalido' });
    }

    const servico = await db.get('SELECT id FROM servicos WHERE id = ? AND tipo_salao = ? AND ativo = 1', [servicoId, tipo_salao]);
    if (!servico) {
      return res.status(404).json({ error: 'Servico nao encontrado' });
    }

    await db.run('UPDATE servico_insumos SET ativo = 0 WHERE servico_id = ?', [servicoId]);

    for (const item of insumos) {
      const estoqueItemId = Number(item.estoque_item_id);
      const quantidadeConsumo = Number(item.quantidade_consumo || 0);
      if (!Number.isInteger(estoqueItemId) || estoqueItemId <= 0 || quantidadeConsumo <= 0) {
        continue;
      }

      const estoqueItem = await db.get(
        'SELECT id FROM estoque_itens WHERE id = ? AND tipo_salao = ? AND ativo = 1',
        [estoqueItemId, tipo_salao]
      );
      if (!estoqueItem) {
        continue;
      }

      await db.run(
        `INSERT INTO servico_insumos (servico_id, estoque_item_id, quantidade_consumo, ativo)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(servico_id, estoque_item_id)
         DO UPDATE SET quantidade_consumo = excluded.quantidade_consumo, ativo = 1`,
        [servicoId, estoqueItemId, quantidadeConsumo]
      );
    }

    res.json({ ok: true, message: 'Vinculos atualizados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const itens = await db.all(
      `SELECT *,
              CASE WHEN quantidade <= estoque_minimo THEN 1 ELSE 0 END as precisa_repor
       FROM estoque_itens
       WHERE ativo = 1 AND tipo_salao = ?
       ORDER BY precisa_repor DESC, nome`,
      [tipo_salao]
    );
    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, categoria, quantidade, estoque_minimo, validade, custo_unitario, tipo_salao = 'feminino' } = req.body;
    
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do item Ã© obrigatÃ³rio' });
    }
    
    if (quantidade === undefined || Number(quantidade) < 0) {
      return res.status(400).json({ error: 'Quantidade nÃ£o pode ser negativa' });
    }
    
    if (estoque_minimo === undefined || Number(estoque_minimo) < 0) {
      return res.status(400).json({ error: 'Estoque mÃ­nimo nÃ£o pode ser negativo' });
    }
    
    const result = await db.run(
      `INSERT INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, validade, custo_unitario, tipo_salao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, categoria || 'uso_interno', Number(quantidade || 0), Number(estoque_minimo || 0), validade || null, Number(custo_unitario || 0), tipo_salao]
    );
    res.status(201).json({ id: result.id, message: 'Item de estoque criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/movimento', async (req, res) => {
  try {
    const { tipo = 'saida', quantidade = 0 } = req.body;
    const item = await db.get('SELECT quantidade FROM estoque_itens WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item nÃ£o encontrado' });

    const atual = Number(item.quantidade || 0);
    const delta = Number(quantidade || 0);
    const nova = tipo === 'entrada' ? atual + delta : Math.max(atual - delta, 0);

    await db.run('UPDATE estoque_itens SET quantidade = ? WHERE id = ?', [nova, req.params.id]);
    res.json({ message: 'Movimento registrado', quantidade: nova });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.run('UPDATE estoque_itens SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item excluÃ­do' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

