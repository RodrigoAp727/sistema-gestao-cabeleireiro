const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/comissoes?tipo_salao=&mes=&ano=
// Retorna comissão calculada por profissional no período
router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const ano = req.query.ano || new Date().getFullYear().toString();
    const mes = req.query.mes
      ? String(req.query.mes).padStart(2, '0')
      : String(new Date().getMonth() + 1).padStart(2, '0');

    // Busca % padrão configurado para este salão
    const cfgSalao = await db.get(
      `SELECT valor FROM configuracoes WHERE tipo_salao = ? AND chave = 'comissao_salao_fornece'`,
      [tipo_salao]
    );
    const cfgProf = await db.get(
      `SELECT valor FROM configuracoes WHERE tipo_salao = ? AND chave = 'comissao_profissional_fornece'`,
      [tipo_salao]
    );
    const padraoSalaoFornece        = Number(cfgSalao?.valor  ?? 35);
    const padraoProfissionalFornece = Number(cfgProf?.valor   ?? 55);

    // Comissão como profissional principal
    // Usa: % individual se configurado, senão % padrão do salão por categoria
    const comoProfissional = await db.all(
      `SELECT
         p.id,
         p.nome,
         p.cargo,
         p.profissional_fornece_produtos,
         CASE
           WHEN p.comissao_percentual IS NOT NULL THEN p.comissao_percentual
           WHEN p.profissional_fornece_produtos = 1 THEN ?
           ELSE ?
         END as comissao_percentual,
         COUNT(c.id)                        as total_comandas,
         COALESCE(SUM(c.valor_total), 0)    as total_faturado,
         COALESCE(SUM(c.valor_total *
           CASE
             WHEN p.comissao_percentual IS NOT NULL THEN p.comissao_percentual
             WHEN p.profissional_fornece_produtos = 1 THEN ?
             ELSE ?
           END / 100
         ), 0) as comissao_calculada
       FROM profissionais p
       LEFT JOIN comandas c
              ON c.profissional_id = p.id
             AND strftime('%Y', c.created_at) = ?
             AND strftime('%m', c.created_at) = ?
             AND c.tipo_salao = ?
       WHERE p.tipo_salao = ? AND p.ativo = 1
       GROUP BY p.id, p.nome, p.cargo, p.profissional_fornece_produtos, p.comissao_percentual
       ORDER BY comissao_calculada DESC`,
      [padraoProfissionalFornece, padraoSalaoFornece,
       padraoProfissionalFornece, padraoSalaoFornece,
       ano, mes, tipo_salao, tipo_salao]
    );

    // Itens por profissional no período (detalhamento)
    const itensPorProfissional = await db.all(
      `SELECT
         p.id as profissional_id,
         ci.descricao,
         ci.tipo_item,
         SUM(ci.quantidade)   as qtd,
         SUM(ci.total)        as total_item
       FROM comanda_itens ci
       JOIN comandas c  ON c.id  = ci.comanda_id
       JOIN profissionais p ON p.id = c.profissional_id
       WHERE c.tipo_salao = ?
         AND strftime('%Y', c.created_at) = ?
         AND strftime('%m', c.created_at) = ?
       GROUP BY p.id, ci.descricao, ci.tipo_item
       ORDER BY total_item DESC`,
      [tipo_salao, ano, mes]
    );

    // Agrupa itens por profissional_id para facilitar frontend
    const itensMapa = {};
    for (const it of itensPorProfissional) {
      if (!itensMapa[it.profissional_id]) itensMapa[it.profissional_id] = [];
      itensMapa[it.profissional_id].push(it);
    }

    const resultado = comoProfissional.map((p) => ({
      ...p,
      itens: itensMapa[p.id] || [],
    }));

    const totalGeral = resultado.reduce(
      (acc, p) => ({
        total_comandas: acc.total_comandas + Number(p.total_comandas),
        total_faturado: acc.total_faturado + Number(p.total_faturado),
        total_comissoes: acc.total_comissoes + Number(p.comissao_calculada),
      }),
      { total_comandas: 0, total_faturado: 0, total_comissoes: 0 }
    );

    res.json({
      ano,
      mes,
      tipo_salao,
      profissionais: resultado,
      totais: totalGeral,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/comissoes/anual?tipo_salao=&ano=
// Resumo mensal de comissões no ano
router.get('/anual', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const ano = req.query.ano || new Date().getFullYear().toString();

    const mensal = await db.all(
      `SELECT
         strftime('%m', c.created_at) as mes,
         p.nome                       as profissional,
         COALESCE(SUM(c.valor_total), 0) as total_faturado,
         COALESCE(SUM(c.valor_total * COALESCE(p.comissao_percentual, 0) / 100), 0) as comissao
       FROM comandas c
       JOIN profissionais p ON p.id = c.profissional_id
       WHERE c.tipo_salao = ?
         AND strftime('%Y', c.created_at) = ?
       GROUP BY mes, p.id
       ORDER BY mes, p.nome`,
      [tipo_salao, ano]
    );

    res.json({ ano, tipo_salao, mensal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
