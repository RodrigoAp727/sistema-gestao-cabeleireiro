/* eslint-disable no-console */
const {
  createMasterClient,
  unique,
  assert,
  assertStatus,
  approxEqual,
  extractItems,
  formatLocalSqlDateTime,
  cleanupById,
  cleanupWhereLike,
} = require('./test-helpers');

const run = async () => {
  const master = await createMasterClient();
  const prefix = unique('COMISSOES');
  const profissionalNome = `${prefix} Profissional`;
  const servicoNome = `${prefix} Serviço`;
  const clienteNome = `${prefix} Cliente`;
  const preco = 200;
  const percentual = 40;
  const esperado = Number((preco * percentual / 100).toFixed(2));
  let profissionalId = null;
  let servicoId = null;
  let comandaId = null;

  try {
    const profissional = await master.request('POST', '/api/profissionais', {
      nome: profissionalNome,
      especialidade: 'Comissão',
      tipo_salao: 'feminino',
      profissional_fornece_produtos: 0,
      comissao_percentual: percentual,
      cargo: 'Profissional de teste',
      horario_trabalho: 'Seg-Sex 09h-18h',
      salario: 0,
      vale_transporte: 0,
      bonificacao: 0,
      dias_trabalho: 'Seg-Sex',
      nivel_acesso: 'profissional',
    });
    assertStatus('Comissões - criar profissional', profissional.status, 201);
    profissionalId = profissional.data?.id;
    assert(profissionalId, 'Comissões - id do profissional não retornado');

    const servico = await master.request('POST', '/api/servicos', {
      nome: servicoNome,
      preco,
      duracao_minutos: 30,
      tipo_salao: 'feminino',
      comissao_tipo: 'percentual',
      comissao_valor: percentual,
      precisa_auxiliar: 0,
      orientacoes_cliente: 'Teste comissão',
    });
    assertStatus('Comissões - criar serviço', servico.status, 201);
    servicoId = servico.data?.id;
    assert(servicoId, 'Comissões - id do serviço não retornado');

    const criarComanda = await master.request('POST', '/api/comandas', {
      tipo_salao: 'feminino',
      cliente_nome: clienteNome,
      profissional_id: profissionalId,
      auxiliar_nome: null,
      desconto: 0,
      sinal_pago: 0,
      itens: [
        {
          servico_id: servicoId,
          tipo_item: 'servico',
          descricao: servicoNome,
          quantidade: 1,
          valor_unitario: preco,
        },
      ],
    });
    assertStatus('Comissões - criar comanda', criarComanda.status, 201);
    comandaId = criarComanda.data?.id;
    assert(comandaId, 'Comissões - id da comanda não retornado');

    const pagar = await master.request('POST', `/api/comandas/${comandaId}/pagamentos`, {
      forma_pagamento: 'pix',
      valor: preco,
    });
    assertStatus('Comissões - pagar comanda', pagar.status, 200);
    assert(Number(pagar.data?.valor_restante || 0) === 0, 'Comissões - valor restante deveria ser zero');
    assert(pagar.data?.status === 'fechada', 'Comissões - comanda não ficou fechada após pagamento');

    const agora = new Date();
    const comissoes = await master.request(
      'GET',
      `/api/comissoes?tipo_salao=feminino&mes=${String(agora.getMonth() + 1).padStart(2, '0')}&ano=${agora.getFullYear()}`
    );
    assertStatus('Comissões - consultar cálculo', comissoes.status, 200);
    const profissionais = Array.isArray(comissoes.data?.profissionais) ? comissoes.data.profissionais : [];
    const profissionalResumo = profissionais.find((item) => Number(item.id) === Number(profissionalId));
    assert(profissionalResumo, 'Comissões - profissional não apareceu no resumo');
    assert(Number(profissionalResumo.total_comandas || 0) >= 1, 'Comissões - total de comandas deveria ser >= 1');
    approxEqual('Comissões - faturamento do profissional', Number(profissionalResumo.total_faturado || 0), preco, 0.01);
    approxEqual('Comissões - comissão calculada', Number(profissionalResumo.comissao_calculada || 0), esperado, 0.01);

    console.log('\n🎉 Comissões regression concluído com sucesso');
  } finally {
    await cleanupById('comanda_pagamentos', 'comanda_id', comandaId);
    await cleanupById('comanda_itens', 'comanda_id', comandaId);
    await cleanupById('comandas', 'id', comandaId);
    await cleanupById('servicos', 'id', servicoId);
    await cleanupById('profissionais', 'id', profissionalId);
    await cleanupWhereLike('comandas', 'cliente_nome', prefix);
    await cleanupWhereLike('servicos', 'nome', prefix);
    await cleanupWhereLike('profissionais', 'nome', prefix);
  }
};

run().catch((error) => {
  console.error(`\n❌ Falha no comissoes-regression-test: ${error.message}`);
  process.exit(1);
});
