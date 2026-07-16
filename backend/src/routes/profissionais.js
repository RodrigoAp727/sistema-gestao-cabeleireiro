const express = require('express');
const db = require('../database');
const router = express.Router();

// Listar todos
router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;
    const profissionais = await db.all(
      'SELECT * FROM profissionais WHERE ativo = 1 AND tipo_salao = ? ORDER BY nome',
      [tipo_salao]
    );
    res.json(profissionais);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      especialidade,
      tipo_salao = 'masculino',
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

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do profissional é obrigatório' });
    }

    const comissaoNormalizada = comissao_percentual === null || comissao_percentual === ''
      ? null
      : Number(comissao_percentual);
    
    if (comissaoNormalizada !== null && (comissaoNormalizada < 0 || comissaoNormalizada > 100)) {
      return res.status(400).json({ error: 'Comissão deve estar entre 0 e 100%' });
    }

    const result = await db.run(
      `INSERT INTO profissionais
      (nome, especialidade, tipo_salao, profissional_fornece_produtos, comissao_percentual, cargo, horario_trabalho, salario, vale_transporte, bonificacao, dias_trabalho, nivel_acesso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        especialidade,
        tipo_salao,
        profissional_fornece_produtos ? 1 : 0,
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar
router.put('/:id', async (req, res) => {
  try {
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

    const comissaoNormalizada = comissao_percentual === null || comissao_percentual === ''
      ? null
      : Number(comissao_percentual);

    await db.run(
      `UPDATE profissionais
       SET nome = ?, especialidade = ?, profissional_fornece_produtos = ?, comissao_percentual = ?,
           cargo = ?, horario_trabalho = ?, salario = ?, vale_transporte = ?, bonificacao = ?, dias_trabalho = ?, nivel_acesso = ?
       WHERE id = ?`,
      [
        nome,
        especialidade,
        profissional_fornece_produtos ? 1 : 0,
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
    res.json({ message: 'Atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.run('UPDATE profissionais SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Profissional excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
