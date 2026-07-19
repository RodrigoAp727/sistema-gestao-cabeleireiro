const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');

const router = express.Router();

router.use(requireRoles(['administrador', 'recepcao']));

const getDataLocalISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

router.get('/resumo', async (req, res) => {
  try {
    const hoje = getDataLocalISO();
    const mes = hoje.slice(0, 7);
    const { tipo_salao = 'feminino' } = req.query;

    const faturamentoDia = await db.get(
      `SELECT SUM(valor_total) as total, COUNT(*) as quantidade
       FROM comandas
       WHERE DATE(created_at) = ? AND tipo_salao = ? AND ativo = 1 AND status = 'fechada'`,
      [hoje, tipo_salao]
    );

    const faturamentoMes = await db.get(
      `SELECT SUM(valor_total) as total, COUNT(*) as quantidade
       FROM comandas
       WHERE strftime('%Y-%m', created_at) = ? AND tipo_salao = ? AND ativo = 1 AND status = 'fechada'`,
      [mes, tipo_salao]
    );

    const recebidoDia = await db.get(
      `SELECT SUM(cp.valor) as total
       FROM comanda_pagamentos cp
       JOIN comandas c ON c.id = cp.comanda_id
       WHERE DATE(cp.created_at) = ? AND c.tipo_salao = ? AND c.ativo = 1`,
      [hoje, tipo_salao]
    );

    const pendente = await db.get(
      `SELECT SUM(valor_restante) as total
       FROM comandas
       WHERE status = 'aberta' AND tipo_salao = ? AND ativo = 1`,
      [tipo_salao]
    );

    const lancamentosMes = await db.all(
      `SELECT tipo, SUM(valor) as total
       FROM caixa_lancamentos
       WHERE strftime('%Y-%m', created_at) = ? AND tipo_salao = ?
       GROUP BY tipo`,
      [mes, tipo_salao]
    );

    const mapaLancamentos = lancamentosMes.reduce((acc, item) => {
      acc[item.tipo] = Number(item.total || 0);
      return acc;
    }, {});

    res.json({
      data: hoje,
      mes,
      tipo_salao,
      faturamento_dia: Number(faturamentoDia?.total || 0),
      atendimentos_dia: Number(faturamentoDia?.quantidade || 0),
      faturamento_mes: Number(faturamentoMes?.total || 0),
      atendimentos_mes: Number(faturamentoMes?.quantidade || 0),
      recebido_dia: Number(recebidoDia?.total || 0),
      pendente: Number(pendente?.total || 0),
      entradas: Number(mapaLancamentos.entrada || 0),
      saidas: Number(mapaLancamentos.saida || 0),
      despesas: Number(mapaLancamentos.despesa || 0),
      contas_a_pagar: Number(mapaLancamentos.conta_pagar || 0),
      lucro_estimado: (Number(faturamentoMes?.total || 0) + Number(mapaLancamentos.entrada || 0))
        - (Number(mapaLancamentos.saida || 0) + Number(mapaLancamentos.despesa || 0)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lancamentos', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const itens = await db.all(
      `SELECT * FROM caixa_lancamentos WHERE tipo_salao = ? ORDER BY created_at DESC`,
      [tipo_salao]
    );
    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lancamentos', async (req, res) => {
  try {
    const { tipo, descricao, valor, vencimento, status = 'aberto', tipo_salao = 'feminino' } = req.body;
    
    if (!tipo || !['entrada', 'saida', 'despesa', 'conta_pagar'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de lanÃ§amento invÃ¡lido' });
    }
    
    if (!descricao || descricao.trim() === '') {
      return res.status(400).json({ error: 'DescriÃ§Ã£o Ã© obrigatÃ³ria' });
    }
    
    if (!valor || Number(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que 0' });
    }
    
    const result = await db.run(
      `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tipo, descricao, Number(valor || 0), vencimento || null, status, tipo_salao]
    );
    res.status(201).json({ id: result.id, message: 'LanÃ§amento registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/lancamentos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });
    
    const lancamento = await db.get('SELECT id FROM caixa_lancamentos WHERE id = ?', [id]);
    if (!lancamento) return res.status(404).json({ error: 'LanÃ§amento nÃ£o encontrado' });
    
    await db.run('DELETE FROM caixa_lancamentos WHERE id = ?', [id]);
    res.json({ ok: true, message: 'LanÃ§amento excluÃ­do' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fechamento', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.body;
    const resumo = await db.get(
      `SELECT SUM(valor_total) as total, COUNT(*) as comandas
       FROM comandas
       WHERE DATE(created_at) = DATE('now') AND tipo_salao = ? AND ativo = 1 AND status = 'fechada'`,
      [tipo_salao]
    );
    res.json({
      message: 'Fechamento diÃ¡rio calculado',
      data: getDataLocalISO(),
      tipo_salao,
      total: Number(resumo?.total || 0),
      comandas: Number(resumo?.comandas || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

