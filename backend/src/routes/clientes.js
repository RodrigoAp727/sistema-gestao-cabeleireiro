const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'masculino', busca = '' } = req.query;

    const clientes = await db.all(
      `SELECT *
       FROM clientes
       WHERE ativo = 1
         AND tipo_salao = ?
         AND (nome LIKE ? OR COALESCE(telefone, '') LIKE ? OR COALESCE(whatsapp, '') LIKE ?)
       ORDER BY nome`,
      [tipo_salao, `%${busca}%`, `%${busca}%`, `%${busca}%`]
    );

    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      nome,
      telefone,
      whatsapp,
      data_nascimento,
      observacoes_cabelo,
      alergias,
      historico_quimico,
      formulas_coloracao,
      tipo_salao = 'masculino',
    } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    
    if (nome.length < 3) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres' });
    }

    const result = await db.run(
      `INSERT INTO clientes
      (nome, telefone, whatsapp, data_nascimento, observacoes_cabelo, alergias, historico_quimico, formulas_coloracao, tipo_salao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        telefone || null,
        whatsapp || null,
        data_nascimento || null,
        observacoes_cabelo || null,
        alergias || null,
        historico_quimico || null,
        formulas_coloracao || null,
        tipo_salao,
      ]
    );

    res.status(201).json({ id: result.id, message: 'Cliente criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
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

    await db.run(
      `UPDATE clientes
       SET nome = ?, telefone = ?, whatsapp = ?, data_nascimento = ?, observacoes_cabelo = ?,
           alergias = ?, historico_quimico = ?, formulas_coloracao = ?, faltas = ?, cancelamentos = ?
       WHERE id = ?`,
      [
        nome,
        telefone || null,
        whatsapp || null,
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/detalhe', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir cliente
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cliente excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/fotos', async (req, res) => {
  try {
    const { tipo = 'antes', url, descricao = null } = req.body;
    const result = await db.run(
      `INSERT INTO cliente_fotos (cliente_id, tipo, url, descricao)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, tipo, url, descricao]
    );
    res.status(201).json({ id: result.id, message: 'Foto registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
