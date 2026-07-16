const express = require('express');
const db = require('../database');
const router = express.Router();

// Listar todos
router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;
    const servicos = await db.all(
      'SELECT * FROM servicos WHERE ativo = 1 AND tipo_salao = ? ORDER BY preco DESC',
      [tipo_salao]
    );
    res.json(servicos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo
router.post('/', async (req, res) => {
  try {
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
    
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do serviço é obrigatório' });
    }
    
    if (!preco || Number(preco) <= 0) {
      return res.status(400).json({ error: 'Preço deve ser maior que 0' });
    }
    
    if (!duracao_minutos || Number(duracao_minutos) <= 0) {
      return res.status(400).json({ error: 'Duração deve ser maior que 0 minutos' });
    }

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
        precisa_auxiliar ? 1 : 0,
        orientacoes_cliente,
        variacao_preco_json ? JSON.stringify(variacao_preco_json) : null,
      ]
    );
    res.status(201).json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar
router.put('/:id', async (req, res) => {
  try {
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
        precisa_auxiliar ? 1 : 0,
        orientacoes_cliente,
        variacao_preco_json ? JSON.stringify(variacao_preco_json) : null,
        req.params.id,
      ]
    );
    res.json({ message: 'Atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Serviço excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
