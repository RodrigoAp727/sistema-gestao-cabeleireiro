# Testes de Regressão

Esta suíte cobre os fluxos principais do backend por chamadas reais de API.

## Como executar

No diretório `backend`, rode:

```bash
npm run test:all
```

Se o backend estiver rodando em outra porta, defina a URL base:

```bash
set AUTH_TEST_BASE_URL=http://localhost:3010
npm run test:all
```

Para validar especificamente proteção contra força bruta no login:

```bash
set AUTH_TEST_BASE_URL=http://localhost:3016
set AUTH_LOGIN_MAX_ATTEMPTS=5
set AUTH_LOGIN_LOCK_WINDOW_SECONDS=15
npm run test:login-protection
```

## O que a suíte cobre

- Autenticação e permissões
- Clientes: criar, buscar, editar e excluir
- Agenda: criar, listar e confirmar agendamento
- Operação: criar comanda, pagar/fechar e validar impacto no caixa
- Estoque: cadastrar item e registrar entrada/saída
- Comissões: validar comissão calculada após operação concluída
- Segurança de login: limite por tentativas, bloqueio temporário, mensagem clara e liberação após expiração

## Observações

- Os testes usam prefixos com `[TESTE]` para evitar colisão com dados reais.
- Cada script faz limpeza dos dados criados ao final da execução.
- A suíte foi pensada para rodar contra a API real, sem framework pesado adicional.
