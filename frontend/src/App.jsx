import React, { useState } from 'react';
import Navbar from './components/Navbar';
import SalaoBanner from './components/SalaoBanner';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Precos from './pages/Precos';
import Clientes from './pages/Clientes';
import Operacao from './pages/Operacao';
import Equipe from './pages/Equipe';
import Estoque from './pages/Estoque';
import Relatorios from './pages/Relatorios';
import WhatsAppCentral from './pages/WhatsAppCentral';
import Comissoes from './pages/Comissoes';

// Mapeamento de páginas - reduz duplicação
const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  agenda: Agenda,
  precos: Precos,
  clientes: Clientes,
  operacao: Operacao,
  equipe: Equipe,
  estoque: Estoque,
  relatorios: Relatorios,
  whatsapp: WhatsAppCentral,
  comissoes: Comissoes,
};

function App() {
  const [pagina, setPagina] = useState('dashboard');
  const [tipoSalao, setTipoSalao] = useState('masculino');
  const [perfil, setPerfil] = useState('administrador');

  const PageComponent = PAGE_COMPONENTS[pagina];

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar
        pagina={pagina}
        setPagina={setPagina}
        tipoSalao={tipoSalao}
        setTipoSalao={setTipoSalao}
        perfil={perfil}
        setPerfil={setPerfil}
      />
      
      <main className="container mx-auto px-4 pb-10 pt-7 md:pt-9">
        <SalaoBanner tipoSalao={tipoSalao} />
        {PageComponent && <PageComponent tipoSalao={tipoSalao} perfil={perfil} />}
      </main>
    </div>
  );
}

export default App;
