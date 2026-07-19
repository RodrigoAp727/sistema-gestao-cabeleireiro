# Deploy

Este projeto deve receber as variáveis sensíveis diretamente no painel do provedor de hospedagem, nunca em arquivo versionado.

## Variáveis sensíveis

Configure, no mínimo, estas variáveis no ambiente de produção:

- `NODE_ENV=production`
- `AUTH_TOKEN_SECRET` com um valor forte e único por ambiente
- `AUTH_ADMIN_PASSWORD`
- `DB_PATH` apontando para o arquivo SQLite do ambiente, se aplicável
- `CORS_ORIGIN` com a URL pública do frontend em produção

Opcionalmente, ajuste também:

- `AUTH_TOKEN_TTL_HOURS`
- `AUTH_MASTER_LOGIN`
- credenciais de integrações externas, como WhatsApp

## Como gerar o segredo

Use um valor aleatório com 64 caracteres hexadecimais:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.randomBytes(32).toString('hex'))"
```

Copie o resultado para a variável `AUTH_TOKEN_SECRET` do painel do serviço. Não reutilize o valor do exemplo em outro ambiente.

## Render

1. Abra o serviço e vá em Environment.
2. Cadastre as variáveis acima uma a uma.
3. Salve e faça deploy.
4. Confirme que `NODE_ENV=production` está ativo.

## Railway

1. Abra o projeto e entre em Variables.
2. Adicione as variáveis sensíveis do backend.
3. Gere `AUTH_TOKEN_SECRET` fora do código e cole o valor no painel.
4. Reimplante a aplicação.

## Vercel

1. Use Vercel apenas para o frontend ou para funções compatíveis com o seu fluxo.
2. Configure as env vars no projeto no painel da Vercel.
3. Garanta que o backend use um serviço próprio ou outro host que aceite o processo Node completo.

## VPS própria

1. Exportar as variáveis no gerenciador do sistema ou no arquivo de serviço.
2. Nunca grave o segredo real dentro do repositório.
3. Reinicie a aplicação após qualquer alteração de segredo.

## Verificação obrigatória

Antes de colocar em produção, valide que o backend recusa iniciar sem `AUTH_TOKEN_SECRET` quando `NODE_ENV=production`.