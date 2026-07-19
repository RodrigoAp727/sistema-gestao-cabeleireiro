/* eslint-disable no-console */
const {
  createMasterClient,
  unique,
  assert,
  assertStatus,
  extractItems,
  cleanupById,
  cleanupWhereLike,
  formatLocalSqlDateTime,
} = require('./test-helpers');

const run = async () => {
  const master = await createMasterClient();
  const prefix = unique('AGENDA');
  const profissionalNome = `${prefix} Profissional`;
  const servicoNome = `${prefix} Serviço`;
  const clienteNome = `${prefix} Cliente`;
  let profissionalId = null;
  let servicoId = null;
  let agendamentoId = null;

  try {
    const profissional = await master.request('POST', '/api/profissionais', {
      nome: profissionalNome,
      especialidade: 'Teste',
      tipo_salao: 'feminino',
      profissional_fornece_produtos: 0,
      comissao_percentual: 30,
      cargo: 'Testador',
      horario_trabalho: 'Seg-Sex 09h-18h',
      salario: 0,
      vale_transporte: 0,
      bonificacao: 0,
      dias_trabalho: 'Seg-Sex',
      nivel_acesso: 'profissional',
    });
    assertStatus('Agenda - criar profissional', profissional.status, 201);
    profissionalId = profissional.data?.id;
    assert(profissionalId, 'Agenda - id do profissional não retornado');

    const servico = await master.request('POST', '/api/servicos', {
      nome: servicoNome,
      preco: 120,
      duracao_minutos: 30,
      tipo_salao: 'feminino',
      comissao_tipo: 'percentual',
      comissao_valor: 40,
      precisa_auxiliar: 0,
      orientacoes_cliente: 'Teste de agenda',
    });
    assertStatus('Agenda - criar serviço', servico.status, 201);
    servicoId = servico.data?.id;
    assert(servicoId, 'Agenda - id do serviço não retornado');

    const dataHora = formatLocalSqlDateTime(new Date(Date.now() + 60 * 60 * 1000));
    const criarAgendamento = await master.request('POST', '/api/agenda', {
      cliente_nome: clienteNome,
      profissional_id: profissionalId,
      servico_id: servicoId,
      data_hora: dataHora,
      tipo_salao: 'feminino',
      itens_agendamento: [
        { profissional_id: profissionalId, servico_id: servicoId, data_hora: dataHora },
      ],
    });
    assertStatus('Agenda - criar agendamento', criarAgendamento.status, 201);
    agendamentoId = criarAgendamento.data?.id;
    assert(agendamentoId, 'Agenda - id do agendamento não retornado');

    const listagem1 = await master.request('GET', '/api/agenda?tipo_salao=feminino&visao=todos');
    assertStatus('Agenda - listar', listagem1.status, 200);
    const agendamentos1 = extractItems(listagem1.data);
    const criado = agendamentos1.find((item) => Number(item.id) === Number(agendamentoId));
    assert(criado, 'Agenda - agendamento criado não apareceu na listagem');
    assert(criado.status === 'agendado', `Agenda - status esperado agendado, obtido ${criado.status}`);

    const confirmar = await master.request('PATCH', `/api/agenda/${agendamentoId}/confirmar`);
    assertStatus('Agenda - confirmar', confirmar.status, 200);

    const listagem2 = await master.request('GET', '/api/agenda?tipo_salao=feminino&visao=todos');
    assertStatus('Agenda - listar após confirmar', listagem2.status, 200);
    const agendamentos2 = extractItems(listagem2.data);
    const confirmado = agendamentos2.find((item) => Number(item.id) === Number(agendamentoId));
    assert(confirmado, 'Agenda - agendamento confirmado não apareceu na listagem');
    assert(confirmado.status === 'confirmado', `Agenda - status esperado confirmado, obtido ${confirmado.status}`);

    console.log('\n🎉 Agenda regression concluído com sucesso');
  } finally {
    await cleanupById('agendamentos', 'id', agendamentoId);
    await cleanupById('servicos', 'id', servicoId);
    await cleanupById('profissionais', 'id', profissionalId);
    await cleanupWhereLike('agendamentos', 'cliente_nome', prefix);
    await cleanupWhereLike('servicos', 'nome', prefix);
    await cleanupWhereLike('profissionais', 'nome', prefix);
  }
};

run().catch((error) => {
  console.error(`\n❌ Falha no agenda-regression-test: ${error.message}`);
  process.exit(1);
});
