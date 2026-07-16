const express = require('express');
const db = require('../database');
const router = express.Router();

// Removidas constantes hardcoded - agora buscadas do banco via getConfigsalon()

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Busca configurações do salão (percentuais de comissão) do banco de dados
const getConfigSalon = async (tipoSalao) => {
  try {
    const cfgSalao = await db.get(`SELECT valor FROM configuracoes WHERE tipo_salao = ? AND chave = 'comissao_salao_fornece'`, [tipoSalao]);
    const cfgProfissional = await db.get(`SELECT valor FROM configuracoes WHERE tipo_salao = ? AND chave = 'comissao_profissional_fornece'`, [tipoSalao]);
    
    return {
      salaoFornece: Number(cfgSalao?.valor ?? 35),
      profissionalFornece: Number(cfgProfissional?.valor ?? 55),
    };
  } catch (err) {
    console.error('Erro ao buscar config de salão:', err);
    return { salaoFornece: 35, profissionalFornece: 55 }; // Fallback
  }
};

const calcularFinanceiroProfissionais = (itens = [], salaoFornece = 35, profissionalFornece = 55) => {
  const itensCalculados = itens.map((item) => {
    const total = Number(item.total || 0);
    const profissionalForneceProdutos = Number(item.profissional_fornece_produtos || 0) === 1;

    const percentualComissao = item.comissao_percentual !== null && item.comissao_percentual !== undefined
      ? Number(item.comissao_percentual)
      : (profissionalForneceProdutos ? profissionalFornece : salaoFornece);

    const valorComissao = total * (percentualComissao / 100);
    const valorRetencao = total - valorComissao;

    return {
      ...item,
      total,
      percentual_comissao: percentualComissao,
      valor_comissao: valorComissao,
      valor_retencao_salao: valorRetencao,
    };
  });

  const ordenadoPorComissao = itensCalculados.sort((a, b) => b.valor_comissao - a.valor_comissao);
  const totalComissao = ordenadoPorComissao.reduce((acc, item) => acc + Number(item.valor_comissao || 0), 0);
  const totalRetencao = ordenadoPorComissao.reduce((acc, item) => acc + Number(item.valor_retencao_salao || 0), 0);
  const totalBruto = ordenadoPorComissao.reduce((acc, item) => acc + Number(item.total || 0), 0);

  return {
    itens: ordenadoPorComissao,
    resumoFinanceiro: {
      total_comissao_profissionais: totalComissao,
      total_retencao_salao: totalRetencao,
      percentual_medio_comissao: totalBruto > 0 ? (totalComissao / totalBruto) * 100 : 0,
    },
  };
};

// Dashboard do dia
router.get('/dia', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const { tipo_salao = 'masculino' } = req.query;
    
    // Busca configurações do salão
    const config = await getConfigSalon(tipo_salao);
    
    // Total do dia
    const total = await db.get(`
      SELECT SUM(preco) as total, COUNT(*) as agendamentos
      FROM agendamentos
      WHERE DATE(data_hora) = ? AND tipo_salao = ? AND status IN ('confirmado', 'agendado')
    `, [hoje, tipo_salao]);

    // Por serviço
    const porServico = await db.all(`
      SELECT s.nome, SUM(a.preco) as total, COUNT(*) as quantidade
      FROM agendamentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE DATE(a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY s.id, s.nome
      ORDER BY total DESC
    `, [hoje, tipo_salao]);

    // Por profissional
    const porProfissional = await db.all(`
      SELECT p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual, SUM(a.preco) as total, COUNT(*) as agendamentos
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      WHERE DATE(a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual
      ORDER BY total DESC
    `, [hoje, tipo_salao]);

    const financeiroProfissionais = calcularFinanceiroProfissionais(porProfissional, config.salaoFornece, config.profissionalFornece);

    res.json({
      data: hoje,
      tipo_salao,
      resumo: total || { total: 0, agendamentos: 0 },
      porServico,
      porProfissional: financeiroProfissionais.itens,
      resumoFinanceiro: financeiroProfissionais.resumoFinanceiro,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard mensal
router.get('/mes', async (req, res) => {
  try {
    const hoje = new Date();
    const ano = String(req.query.ano || hoje.getFullYear());
    const mesNumero = String(req.query.mes || String(hoje.getMonth() + 1).padStart(2, '0')).padStart(2, '0');
    const mes = `${ano}-${mesNumero}`;
    const { tipo_salao = 'masculino' } = req.query;

    // Busca configurações do salão
    const config = await getConfigSalon(tipo_salao);

    const total = await db.get(`
      SELECT SUM(preco) as total, COUNT(*) as agendamentos
      FROM agendamentos
      WHERE strftime('%Y-%m', data_hora) = ? AND tipo_salao = ? AND status IN ('confirmado', 'agendado')
    `, [mes, tipo_salao]);

    const porDia = await db.all(`
      SELECT DATE(data_hora) as dia, SUM(preco) as total, COUNT(*) as agendamentos
      FROM agendamentos
      WHERE strftime('%Y-%m', data_hora) = ? AND tipo_salao = ? AND status IN ('confirmado', 'agendado')
      GROUP BY DATE(data_hora)
      ORDER BY dia DESC
    `, [mes, tipo_salao]);

    const porServico = await db.all(`
      SELECT s.nome, SUM(a.preco) as total, COUNT(*) as quantidade
      FROM agendamentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE strftime('%Y-%m', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY s.id, s.nome
      ORDER BY total DESC
    `, [mes, tipo_salao]);

    const porProfissional = await db.all(`
      SELECT p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual, SUM(a.preco) as total, COUNT(*) as agendamentos
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      WHERE strftime('%Y-%m', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual
      ORDER BY total DESC
    `, [mes, tipo_salao]);

    const financeiroProfissionais = calcularFinanceiroProfissionais(porProfissional, config.salaoFornece, config.profissionalFornece);

    res.json({
      mes,
      tipo_salao,
      resumo: total || { total: 0, agendamentos: 0 },
      total: total || { total: 0, agendamentos: 0 },
      porDia,
      porServico,
      porProfissional: financeiroProfissionais.itens,
      resumoFinanceiro: financeiroProfissionais.resumoFinanceiro,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard anual (12 meses)
router.get('/anual', async (req, res) => {
  try {
    const ano = String(req.query.ano || new Date().getFullYear());
    const { tipo_salao = 'masculino' } = req.query;

    // Busca configurações do salão
    const config = await getConfigSalon(tipo_salao);

    const resumoAnual = await db.get(`
      SELECT SUM(preco) as total, COUNT(*) as agendamentos
      FROM agendamentos
      WHERE strftime('%Y', data_hora) = ? AND tipo_salao = ? AND status IN ('confirmado', 'agendado')
    `, [ano, tipo_salao]);

    const totaisPorMes = await db.all(`
      SELECT strftime('%m', data_hora) as mes_numero, SUM(preco) as total, COUNT(*) as agendamentos
      FROM agendamentos
      WHERE strftime('%Y', data_hora) = ? AND tipo_salao = ? AND status IN ('confirmado', 'agendado')
      GROUP BY strftime('%m', data_hora)
      ORDER BY mes_numero
    `, [ano, tipo_salao]);

    const porServicoMes = await db.all(`
      SELECT strftime('%m', a.data_hora) as mes_numero, s.nome, SUM(a.preco) as total, COUNT(*) as quantidade
      FROM agendamentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE strftime('%Y', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY strftime('%m', a.data_hora), s.id, s.nome
      ORDER BY mes_numero, total DESC
    `, [ano, tipo_salao]);

    const profissionaisPorMes = await db.all(`
      SELECT strftime('%m', a.data_hora) as mes_numero,
             p.id,
             p.nome,
             p.profissional_fornece_produtos,
             p.comissao_percentual,
             SUM(a.preco) as total,
             COUNT(*) as agendamentos
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      WHERE strftime('%Y', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY strftime('%m', a.data_hora), p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual
      ORDER BY mes_numero, total DESC
    `, [ano, tipo_salao]);

    const servicosPorProfissionalMes = await db.all(`
      SELECT strftime('%m', a.data_hora) as mes_numero,
             p.id as profissional_id,
             s.nome as servico_nome,
             COUNT(*) as quantidade,
             SUM(a.preco) as total
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      JOIN servicos s ON a.servico_id = s.id
      WHERE strftime('%Y', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY strftime('%m', a.data_hora), p.id, s.id, s.nome
      ORDER BY mes_numero, p.nome, quantidade DESC
    `, [ano, tipo_salao]);

    const profissionaisAno = await db.all(`
      SELECT p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual, SUM(a.preco) as total, COUNT(*) as agendamentos
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      WHERE strftime('%Y', a.data_hora) = ? AND a.tipo_salao = ? AND a.status IN ('confirmado', 'agendado')
      GROUP BY p.id, p.nome, p.profissional_fornece_produtos, p.comissao_percentual
      ORDER BY total DESC
    `, [ano, tipo_salao]);

    const meses = NOMES_MESES.map((nome, idx) => {
      const mesNumero = String(idx + 1).padStart(2, '0');
      return {
        mes_numero: mesNumero,
        mes_nome: nome,
        resumo: { total: 0, agendamentos: 0 },
        resumoFinanceiro: {
          total_comissao_profissionais: 0,
          total_retencao_salao: 0,
          percentual_medio_comissao: 0,
        },
        porProfissional: [],
        porServico: [],
      };
    });

    const mesesMap = new Map(meses.map((mesItem) => [mesItem.mes_numero, mesItem]));

    totaisPorMes.forEach((item) => {
      const mesItem = mesesMap.get(item.mes_numero);
      if (!mesItem) return;
      mesItem.resumo = {
        total: Number(item.total || 0),
        agendamentos: Number(item.agendamentos || 0),
      };
    });

    porServicoMes.forEach((item) => {
      const mesItem = mesesMap.get(item.mes_numero);
      if (!mesItem) return;
      mesItem.porServico.push({
        nome: item.nome,
        total: Number(item.total || 0),
        quantidade: Number(item.quantidade || 0),
      });
    });

    const servicosMap = new Map();
    servicosPorProfissionalMes.forEach((item) => {
      const chave = `${item.mes_numero}-${item.profissional_id}`;
      const atual = servicosMap.get(chave) || [];
      atual.push({
        nome: item.servico_nome,
        quantidade: Number(item.quantidade || 0),
        total: Number(item.total || 0),
      });
      servicosMap.set(chave, atual);
    });

    const profissionaisPorMesMap = new Map();
    profissionaisPorMes.forEach((item) => {
      const atual = profissionaisPorMesMap.get(item.mes_numero) || [];
      atual.push(item);
      profissionaisPorMesMap.set(item.mes_numero, atual);
    });

    meses.forEach((mesItem) => {
      const listaProfissionaisMes = profissionaisPorMesMap.get(mesItem.mes_numero) || [];
      const financeiroMes = calcularFinanceiroProfissionais(listaProfissionaisMes, config.salaoFornece, config.profissionalFornece);

      mesItem.porProfissional = financeiroMes.itens.map((prof) => {
        const chave = `${mesItem.mes_numero}-${prof.id}`;
        return {
          ...prof,
          servicos_realizados: servicosMap.get(chave) || [],
        };
      });
      mesItem.resumoFinanceiro = financeiroMes.resumoFinanceiro;
    });

    const financeiroAno = calcularFinanceiroProfissionais(profissionaisAno, config.salaoFornece, config.profissionalFornece);

    res.json({
      ano,
      tipo_salao,
      resumoAnual: {
        total: Number((resumoAnual && resumoAnual.total) || 0),
        agendamentos: Number((resumoAnual && resumoAnual.agendamentos) || 0),
      },
      resumoFinanceiroAnual: financeiroAno.resumoFinanceiro,
      porProfissionalAnual: financeiroAno.itens,
      meses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
