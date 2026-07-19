/* eslint-disable no-console */
const {
  createMasterClient,
  unique,
  assert,
  assertStatus,
  approxEqual,
  cleanupById,
  cleanupWhereLike,
  extractItems,
} = require('./test-helpers');

const run = async () => {
  const master = await createMasterClient();
  const prefix = unique('OPERACAO');
  const profissionalNome = `${prefix} Profissional`;
  const servicoNome = `${prefix} Serviço`;
  const clienteNome = `${prefix} Cliente da Comanda`;
  const preco = 150.75;
  let profissionalId = null;
  let servicoId = null;
  let comandaId = null;

  try {
    const profissional = await master.request('POST', '/api/profissionais', {
      nome: profissionalNome,
      especialidade: 'Comissão',
      tipo_salao: 'feminino',
      profissional_fornece_produtos: 0,
      comissao_percentual: 25,
      cargo: 'Profissional de teste',
      horario_trabalho: 'Seg-Sex 09h-18h',
      salario: 0,
      vale_transporte: 0,
      bonificacao: 0,
      dias_trabalho: 'Seg-Sex',
      nivel_acesso: 'profissional',
    });
    assertStatus('Operação - criar profissional', profissional.status, 201);
    profissionalId = profissional.data?.id;
    assert(profissionalId, 'Operação - id do profissional não retornado');

    const servico = await master.request('POST', '/api/servicos', {
      nome: servicoNome,
      preco,
      duracao_minutos: 45,
      tipo_salao: 'feminino',
      comissao_tipo: 'percentual',
      comissao_valor: 25,
      precisa_auxiliar: 0,
      orientacoes_cliente: 'Teste operacional',
    });
    assertStatus('Operação - criar serviço', servico.status, 201);
    servicoId = servico.data?.id;
    assert(servicoId, 'Operação - id do serviço não retornado');

    const beforeResumo = await master.request('GET', '/api/caixa/resumo?tipo_salao=feminino');
    assertStatus('Operação - ler caixa antes', beforeResumo.status, 200);
    const beforeRecebido = Number(beforeResumo.data?.recebido_dia || 0);
    const beforeFaturamento = Number(beforeResumo.data?.faturamento_dia || 0);

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
    assertStatus('Operação - criar comanda', criarComanda.status, 201);
    comandaId = criarComanda.data?.id;
    assert(comandaId, 'Operação - id da comanda não retornado');

    const listaComandas = await master.request('GET', '/api/comandas?tipo_salao=feminino');
    assertStatus('Operação - listar comandas', listaComandas.status, 200);
    const comandas = extractItems(listaComandas.data);
    const comandaCriada = comandas.find((item) => Number(item.id) === Number(comandaId));
    assert(comandaCriada, 'Operação - comanda criada não apareceu na listagem');
    assert(comandaCriada.status === 'aberta', `Operação - status esperado aberta, obtido ${comandaCriada.status}`);

    const pagar = await master.request('POST', `/api/comandas/${comandaId}/pagamentos`, {
      forma_pagamento: 'pix',
      valor: preco,
    });
    assertStatus('Operação - pagar comanda', pagar.status, 200);
    assert(Number(pagar.data?.valor_restante || 0) === 0, 'Operação - valor restante deveria ser zero');
    assert(pagar.data?.status === 'fechada', `Operação - status esperado fechada, obtido ${pagar.data?.status}`);

    const detalheComanda = await master.request('GET', `/api/comandas/${comandaId}`);
    assertStatus('Operação - ler comanda fechada', detalheComanda.status, 200);
    assert(Number(detalheComanda.data?.valor_restante || 0) === 0, 'Operação - comanda deveria estar totalmente paga');
    assert(detalheComanda.data?.status === 'fechada', 'Operação - comanda não ficou fechada');
    assert(Array.isArray(detalheComanda.data?.pagamentos) && detalheComanda.data.pagamentos.length === 1, 'Operação - pagamento não foi registrado');

    const afterResumo = await master.request('GET', '/api/caixa/resumo?tipo_salao=feminino');
    assertStatus('Operação - ler caixa depois', afterResumo.status, 200);
    const afterRecebido = Number(afterResumo.data?.recebido_dia || 0);
    const afterFaturamento = Number(afterResumo.data?.faturamento_dia || 0);

    approxEqual('Operação - caixa recebido aumentou', afterRecebido - beforeRecebido, preco, 0.01);
    approxEqual('Operação - faturamento aumentou', afterFaturamento - beforeFaturamento, preco, 0.01);

    console.log('\n🎉 Operação regression concluído com sucesso');
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
  console.error(`\n❌ Falha no operacao-regression-test: ${error.message}`);
  process.exit(1);
});
