/* eslint-disable no-console */
const {
  createMasterClient,
  unique,
  assert,
  assertStatus,
  extractItems,
  cleanupById,
  cleanupWhereLike,
} = require('./test-helpers');

const run = async () => {
  const master = await createMasterClient();
  const prefix = unique('ESTOQUE');
  const itemNome = `${prefix} Item`;
  let itemId = null;

  try {
    const create = await master.request('POST', '/api/estoque', {
      tipo_salao: 'feminino',
      nome: itemNome,
      categoria: 'uso_interno',
      quantidade: 10,
      estoque_minimo: 2,
      validade: null,
      custo_unitario: 5,
    });
    assertStatus('Estoque - criar item', create.status, 201);
    itemId = create.data?.id;
    assert(itemId, 'Estoque - id do item não retornado');

    const list1 = await master.request('GET', '/api/estoque?tipo_salao=feminino&page=1&limit=100');
    assertStatus('Estoque - listar itens', list1.status, 200);
    const itens1 = extractItems(list1.data);
    const itemCriado = itens1.find((item) => Number(item.id) === Number(itemId));
    assert(itemCriado, 'Estoque - item criado não apareceu na listagem');
    assert(Number(itemCriado.quantidade || 0) === 10, `Estoque - quantidade inicial esperada 10, obtida ${itemCriado.quantidade}`);

    const entrada = await master.request('PATCH', `/api/estoque/${itemId}/movimento`, {
      tipo: 'entrada',
      quantidade: 5,
    });
    assertStatus('Estoque - entrada', entrada.status, 200);
    assert(Number(entrada.data?.quantidade || 0) === 15, 'Estoque - quantidade após entrada deveria ser 15');

    const list2 = await master.request('GET', '/api/estoque?tipo_salao=feminino&page=1&limit=100');
    assertStatus('Estoque - listar após entrada', list2.status, 200);
    const itens2 = extractItems(list2.data);
    const itemEntrada = itens2.find((item) => Number(item.id) === Number(itemId));
    assert(itemEntrada, 'Estoque - item não encontrado após entrada');
    assert(Number(itemEntrada.quantidade || 0) === 15, `Estoque - quantidade esperada 15 após entrada, obtida ${itemEntrada.quantidade}`);

    const saida = await master.request('PATCH', `/api/estoque/${itemId}/movimento`, {
      tipo: 'saida',
      quantidade: 3,
    });
    assertStatus('Estoque - saída', saida.status, 200);
    assert(Number(saida.data?.quantidade || 0) === 12, 'Estoque - quantidade após saída deveria ser 12');

    const list3 = await master.request('GET', '/api/estoque?tipo_salao=feminino&page=1&limit=100');
    assertStatus('Estoque - listar após saída', list3.status, 200);
    const itens3 = extractItems(list3.data);
    const itemSaida = itens3.find((item) => Number(item.id) === Number(itemId));
    assert(itemSaida, 'Estoque - item não encontrado após saída');
    assert(Number(itemSaida.quantidade || 0) === 12, `Estoque - quantidade esperada 12 após saída, obtida ${itemSaida.quantidade}`);

    console.log('\n🎉 Estoque regression concluído com sucesso');
  } finally {
    await cleanupById('estoque_itens', 'id', itemId);
    await cleanupWhereLike('estoque_itens', 'nome', prefix);
  }
};

run().catch((error) => {
  console.error(`\n❌ Falha no estoque-regression-test: ${error.message}`);
  process.exit(1);
});
