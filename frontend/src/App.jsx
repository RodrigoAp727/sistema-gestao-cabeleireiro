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

function App() {
  const [pagina, setPagina] = useState('dashboard');
  const tipoSalao = 'masculino'; // Sempre masculino
  const [perfil, setPerfil] = useState('administrador');

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar
        pagina={pagina}
        setPagina={setPagina}
        tipoSalao={tipoSalao}
        perfil={perfil}
        setPerfil={setPerfil}
      />
      
      <main className="container mx-auto px-4 pb-10 pt-7 md:pt-9">
        <SalaoBanner tipoSalao={tipoSalao} />
        {pagina === 'dashboard' && <Dashboard tipoSalao={tipoSalao} />}
        {pagina === 'agenda' && <Agenda tipoSalao={tipoSalao} />}
        {pagina === 'precos' && <Precos tipoSalao={tipoSalao} />}
        {pagina === 'clientes' && <Clientes tipoSalao={tipoSalao} />}
        {pagina === 'operacao' && <Operacao tipoSalao={tipoSalao} />}
        {pagina === 'equipe' && <Equipe tipoSalao={tipoSalao} />}
        {pagina === 'estoque' && <Estoque tipoSalao={tipoSalao} />}
        {pagina === 'relatorios' && <Relatorios tipoSalao={tipoSalao} />}
        {pagina === 'whatsapp' && <WhatsAppCentral tipoSalao={tipoSalao} />}
        {pagina === 'comissoes' && <Comissoes tipoSalao={tipoSalao} perfil={perfil} />}
      </main>
    </div>
  );
}

export default App;
