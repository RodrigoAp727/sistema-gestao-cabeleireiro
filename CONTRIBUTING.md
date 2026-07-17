# 🤝 Contribuindo para o Projeto

Obrigado por seu interesse em contribuir para o **Sistema de Gestão para Barbearias**! Este documento fornece diretrizes para contribuir.

---

## 🎯 Como Contribuir

### 1. Fork o Repositório
```bash
# Clone seu fork
git clone https://github.com/SEU-USUARIO/sistema-gestao-cabeleireiro.git
cd sistema-gestao-cabeleireiro
```

### 2. Crie uma Branch
```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug
```

### 3. Faça as Alterações
- Mantenha o código limpo e bem documentado
- Siga os padrões já estabelecidos no projeto
- Adicione testes se aplicável

### 4. Commit com Mensagens Claras
```bash
git commit -m "🎨 feat: adicionar nova funcionalidade"
git commit -m "🐛 fix: corrigir bug em X"
git commit -m "📝 docs: atualizar documentação"
```

**Prefixos sugeridos:**
- `🎨 feat:` - Nova funcionalidade
- `🐛 fix:` - Correção de bug
- `📝 docs:` - Documentação
- `🔧 refactor:` - Refatoração de código
- `⚡ perf:` - Melhoria de performance
- `✅ test:` - Testes

### 5. Push e Crie um Pull Request
```bash
git push origin feature/sua-feature
```

---

## 📋 Checklist Antes de Submeter PR

- [ ] Código segue os padrões do projeto
- [ ] Sem console.log desnecessários
- [ ] Testado localmente
- [ ] Commit messages claras
- [ ] README atualizado (se necessário)
- [ ] Sem conflitos com `main`

---

## 🏗️ Padrões de Código

### Backend (Node.js)
```javascript
// ✅ BOM
async function buscarClientes(tipo_salao) {
  try {
    const clientes = await db.all('SELECT * FROM clientes WHERE tipo_salao = ?', [tipo_salao]);
    return { ok: true, data: clientes };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ❌ EVITAR
function buscarClientes(tipoSalao, callback) {
  db.all('SELECT * FROM clientes WHERE tipo_salao = ?', [tipoSalao], (err, rows) => {
    if (err) callback(err);
    else callback(null, rows);
  });
}
```

### Frontend (React)
```jsx
// ✅ BOM
export function ClienteCard({ cliente, onDelete }) {
  return (
    <div className="card">
      <h3>{cliente.nome}</h3>
      <button onClick={() => onDelete(cliente.id)}>Deletar</button>
    </div>
  );
}

// ❌ EVITAR
const ClienteCard = (props) => {
  return <div><h3>{props.c.n}</h3></div>;
}
```

---

## 🔍 Relatando Bugs

Ao reportar um bug, inclua:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs real
- Prints/videos se possível
- Ambiente (SO, versão Node, etc)

**Exemplo:**
```
Título: [BUG] DELETE não funciona em Agenda

Descrição:
Ao clicar em Excluir em um agendamento, a aplicação não remove o item.

Passos:
1. Ir para página Agenda
2. Clicar em Excluir em qualquer agendamento
3. Confirmar exclusão
4. Item continua listado

Esperado:
Item deveria ser removido da lista

Recebido:
Item ainda aparece após exclusão

Ambiente:
- Node.js v24.14.0
- Windows 10
- Chrome 120
```

---

## 📚 Ideias para Contribuir

### Funcionalidades Desejadas
- [ ] SMS/Email de confirmação
- [ ] App Mobile
- [ ] Sistema de pagamento integrado
- [ ] Relatórios em PDF
- [ ] Multi-unidade/franquia
- [ ] Integração com Google Calendar

### Melhorias de Código
- [ ] Adicionar mais testes
- [ ] Melhorar validação
- [ ] Otimizar performance
- [ ] Documentar APIs
- [ ] Tradução i18n

### Documentação
- [ ] Guias de setup
- [ ] Vídeos tutoriais
- [ ] Exemplos de uso
- [ ] Guia de deployment

---

## 📞 Contato

- **Issues:** Use GitHub Issues para reportar bugs
- **Discussions:** Use GitHub Discussions para dúvidas
- **Email:** rodrigoapcampos92@gmail.com

---

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a MIT License.

---

**Obrigado por contribuir! Sua ajuda faz diferença!** 💪
