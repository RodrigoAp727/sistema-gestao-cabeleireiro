const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/basico', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;

    const faturamento = await db.get(
      `SELECT SUM(valor_total) as total, COUNT(*) as comandas FROM comandas WHERE tipo_salao = ?`,
      [tipo_salao]
    );

    const maisVendidos = await db.all(
      `SELECT descricao, SUM(quantidade) as quantidade, SUM(total) as total
       FROM comanda_itens ci
       JOIN comandas c ON c.id = ci.comanda_id
       WHERE c.tipo_salao = ?
       GROUP BY descricao
       ORDER BY quantidade DESC
       LIMIT 10`,
      [tipo_salao]
    );

    const clientesAtendidos = await db.get(
      `SELECT COUNT(DISTINCT cliente_nome) as total FROM comandas WHERE tipo_salao = ?`,
      [tipo_salao]
    );

    const faltasCancelamentos = await db.get(
      `SELECT
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelamentos,
          SUM(CASE WHEN status = 'agendado' THEN 1 ELSE 0 END) as pendentes
       FROM agendamentos
       WHERE tipo_salao = ?`,
      [tipo_salao]
    );

    const comissoes = await db.all(
      `SELECT nome, comissao_percentual FROM profissionais WHERE ativo = 1 AND tipo_salao = ? ORDER BY nome`,
      [tipo_salao]
    );

    const desempenho = await db.all(
      `SELECT p.nome, COUNT(a.id) as atendimentos, SUM(a.preco) as faturamento
       FROM profissionais p
       LEFT JOIN agendamentos a ON a.profissional_id = p.id AND a.status IN ('confirmado', 'agendado')
       WHERE p.tipo_salao = ?
       GROUP BY p.id, p.nome
       ORDER BY faturamento DESC`,
      [tipo_salao]
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
