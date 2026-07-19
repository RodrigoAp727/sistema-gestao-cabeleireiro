module.exports = {
  id: '20260719_rename_pin_hash_to_senha_hash',
  name: 'Renomeia coluna pin_hash para senha_hash em sistema_usuarios',
  up: async ({ run, all }) => {
    const columns = await all('PRAGMA table_info(sistema_usuarios)');
    const nomes = new Set((columns || []).map((col) => col.name));

    if (nomes.has('senha_hash')) {
      return;
    }

    if (nomes.has('pin_hash')) {
      await run('ALTER TABLE sistema_usuarios RENAME COLUMN pin_hash TO senha_hash');
      return;
    }

    await run('ALTER TABLE sistema_usuarios ADD COLUMN senha_hash TEXT');
  },
};
