const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');

const router = express.Router();

router.use(requireRoles(['administrador']));

router.get('/basico', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const hoje = new Date();
    const ano = String(req.query.ano || hoje.getFullYear());
    const mes = String(req.query.mes || String(hoje.getMonth() + 1).padStart(2, '0')).padStart(2, '0');

    const faturamento = await db.get(
      `SELECT SUM(valor_total) as total, COUNT(*) as comandas
       FROM comandas
       WHERE tipo_salao = ?
         AND ativo = 1
         AND status = 'fechada'
         AND strftime('%Y', created_at) = ?
         AND strftime('%m', created_at) = ?`,
      [tipo_salao, ano, mes]
    );

    const maisVendidos = await db.all(
      `SELECT descricao, SUM(quantidade) as quantidade, SUM(total) as total
       FROM comanda_itens ci
       JOIN comandas c ON c.id = ci.comanda_id
       WHERE c.tipo_salao = ?
         AND c.ativo = 1
         AND c.status = 'fechada'
         AND strftime('%Y', c.created_at) = ?
         AND strftime('%m', c.created_at) = ?
       GROUP BY descricao
       ORDER BY quantidade DESC
       LIMIT 10`,
      [tipo_salao, ano, mes]
    );

    const clientesAtendidos = await db.get(
      `SELECT COUNT(DISTINCT cliente_nome) as total
       FROM comandas
       WHERE tipo_salao = ?
         AND ativo = 1
         AND status = 'fechada'
         AND strftime('%Y', created_at) = ?
         AND strftime('%m', created_at) = ?`,
      [tipo_salao, ano, mes]
    );

    const faltasCancelamentos = await db.get(
      `SELECT
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelamentos,
          SUM(CASE WHEN status = 'agendado' THEN 1 ELSE 0 END) as pendentes
       FROM agendamentos
       WHERE tipo_salao = ?
         AND strftime('%Y', data_hora) = ?
         AND strftime('%m', data_hora) = ?`,
      [tipo_salao, ano, mes]
    );

    const comissoes = await db.all(
      `SELECT nome, comissao_percentual FROM profissionais WHERE ativo = 1 AND tipo_salao = ? ORDER BY nome`,
      [tipo_salao]
    );

    const desempenho = await db.all(
      `SELECT
         p.nome,
         COUNT(c.id) as atendimentos,
         COALESCE(SUM(c.valor_total), 0) as faturamento
       FROM profissionais p
       LEFT JOIN comandas c
              ON c.profissional_id = p.id
             AND c.tipo_salao = ?
             AND c.ativo = 1
               AND c.status = 'fechada'
             AND strftime('%Y', c.created_at) = ?
             AND strftime('%m', c.created_at) = ?
       WHERE p.tipo_salao = ? AND p.ativo = 1
       GROUP BY p.id, p.nome
       ORDER BY faturamento DESC`,
      [tipo_salao, ano, mes, tipo_salao]
    );

    const estoque = await db.all(
      `SELECT nome, quantidade, estoque_minimo,
              CASE WHEN quantidade <= estoque_minimo THEN 1 ELSE 0 END as alerta
       FROM estoque_itens
       WHERE ativo = 1 AND tipo_salao = ?
       ORDER BY alerta DESC, nome`,
      [tipo_salao]
    );

    const semRetorno = await db.all(
      `SELECT c.nome, MAX(cm.created_at) as ultimo_atendimento
       FROM clientes c
       LEFT JOIN comandas cm ON cm.cliente_id = c.id
       WHERE c.ativo = 1 AND c.tipo_salao = ?
       GROUP BY c.id, c.nome
       ORDER BY ultimo_atendimento ASC
       LIMIT 20`,
      [tipo_salao]
    );

    res.json({
      ano,
      mes,
      tipo_salao,
      faturamento: Number(faturamento?.total || 0),
      comandas: Number(faturamento?.comandas || 0),
      clientes_atendidos: Number(clientesAtendidos?.total || 0),
      faltas_cancelamentos: {
        cancelamentos: Number(faltasCancelamentos?.cancelamentos || 0),
        pendentes: Number(faltasCancelamentos?.pendentes || 0),
      },
      servicos_mais_vendidos: maisVendidos,
      comissoes,
      desempenho,
      estoque,
      clientes_sem_retorno: semRetorno,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

