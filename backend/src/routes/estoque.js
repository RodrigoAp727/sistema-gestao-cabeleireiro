const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;
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
    const { nome, categoria, quantidade, estoque_minimo, validade, custo_unitario, tipo_salao = 'masculino' } = req.body;
    
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do item é obrigatório' });
    }
    
    if (quantidade === undefined || Number(quantidade) < 0) {
      return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
    }
    
    if (estoque_minimo === undefined || Number(estoque_minimo) < 0) {
      return res.status(400).json({ error: 'Estoque mínimo não pode ser negativo' });
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
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

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
    res.json({ message: 'Item excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
