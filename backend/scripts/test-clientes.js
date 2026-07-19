/* eslint-disable no-console */
const {
  createMasterClient,
  unique,
  assert,
  assertStatus,
  extractItems,
  extractTotal,
  cleanupById,
  cleanupWhereLike,
} = require('./test-helpers');

const run = async () => {
  const master = await createMasterClient();
  const prefix = unique('CLIENTES');
  const nomeOriginal = `${prefix} Base`;
  const nomeEditado = `${prefix} Editado`;
  let clienteId = null;

  try {
    const create = await master.request('POST', '/api/clientes', {
      tipo_salao: 'feminino',
      nome: nomeOriginal,
      telefone: '11999990001',
      whatsapp: '11999990002',
      data_nascimento: '1990-01-01',
      observacoes_cabelo: 'Cliente de teste',
      alergias: 'Nenhuma',
      historico_quimico: 'Nenhum',
      formulas_coloracao: 'Sem fórmula',
    });
    assertStatus('Clientes - criar', create.status, 201);
    clienteId = create.data?.id;
    assert(clienteId, 'Clientes - id não retornado na criação');

    const busca1 = await master.request(
      'GET',
      `/api/clientes?tipo_salao=feminino&busca=${encodeURIComponent(prefix)}&page=1&limit=20`
    );
    assertStatus('Clientes - buscar criado', busca1.status, 200);
    const itens1 = extractItems(busca1.data);
    assert(itens1.length === 1, `Clientes - esperado 1 resultado, obtido ${itens1.length}`);
    assert(extractTotal(busca1.data, itens1) === 1, 'Clientes - total incorreto na busca');
    assert(itens1[0].id === clienteId, 'Clientes - cliente criado não encontrado na busca');

    const editar = await master.request('PUT', `/api/clientes/${clienteId}`, {
      nome: nomeEditado,
      telefone: '11999990003',
      whatsapp: '11999990004',
      data_nascimento: '1991-02-02',
      observacoes_cabelo: 'Cliente editado',
      alergias: 'Sem alergias',
      historico_quimico: 'Coloração leve',
      formulas_coloracao: 'Nova fórmula',
      faltas: 1,
      cancelamentos: 2,
    });
    assertStatus('Clientes - editar', editar.status, 200);

    const busca2 = await master.request(
      'GET',
      `/api/clientes?tipo_salao=feminino&busca=${encodeURIComponent(prefix)}&page=1&limit=20`
    );
    assertStatus('Clientes - buscar após editar', busca2.status, 200);
    const itens2 = extractItems(busca2.data);
    assert(itens2.length === 1, `Clientes - esperado 1 resultado após edição, obtido ${itens2.length}`);
    assert(itens2[0].nome === nomeEditado, 'Clientes - edição não refletida na busca');
    assert(Number(itens2[0].faltas || 0) === 1, 'Clientes - faltas não atualizadas');
    assert(Number(itens2[0].cancelamentos || 0) === 2, 'Clientes - cancelamentos não atualizados');

    const excluir = await master.request('DELETE', `/api/clientes/${clienteId}`);
    assertStatus('Clientes - excluir', excluir.status, 200);

    const busca3 = await master.request(
      'GET',
      `/api/clientes?tipo_salao=feminino&busca=${encodeURIComponent(prefix)}&page=1&limit=20`
    );
    assertStatus('Clientes - buscar após excluir', busca3.status, 200);
    const itens3 = extractItems(busca3.data);
    assert(itens3.length === 0, `Clientes - esperado 0 resultados após exclusão, obtido ${itens3.length}`);
    assert(extractTotal(busca3.data, itens3) === 0, 'Clientes - total deveria ser zero após exclusão');

    console.log('\n🎉 Clientes regression concluído com sucesso');
  } finally {
    await cleanupById('cliente_fotos', 'cliente_id', clienteId);
    await cleanupById('clientes', 'id', clienteId);
    await cleanupWhereLike('clientes', 'nome', prefix);
  }
};

run().catch((error) => {
  console.error(`\n❌ Falha no clientes-regression-test: ${error.message}`);
  process.exit(1);
});
