export const TABS_MENU = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'precos', label: 'Preços' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'operacao', label: 'Operação' },
  { id: 'comissoes', label: 'Comissões' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'usuarios', label: 'Usuários' },
];

export const PAGINAS_POR_PERFIL = {
  administrador: ['dashboard', 'agenda', 'precos', 'clientes', 'operacao', 'comissoes', 'equipe', 'estoque', 'relatorios', 'whatsapp', 'usuarios'],
  recepcao: ['dashboard', 'agenda', 'clientes', 'operacao', 'whatsapp'],
  profissional: ['dashboard', 'agenda', 'clientes', 'comissoes'],
};

export const obterPaginasPermitidas = (perfil, usuario) => {
  const paginasBase = [...(PAGINAS_POR_PERFIL[perfil] || PAGINAS_POR_PERFIL.administrador)];
  if (perfil === 'administrador' && !usuario?.is_master_admin) {
    return paginasBase.filter((pagina) => pagina !== 'usuarios');
  }
  return paginasBase;
};

export const obterTabsPermitidas = (perfil, usuario) => {
  const paginasPermitidas = obterPaginasPermitidas(perfil, usuario);
  return TABS_MENU.filter((tab) => paginasPermitidas.includes(tab.id));
};