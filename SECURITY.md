# 🔒 Segurança

## Relatando Vulnerabilidades de Segurança

Se você descobrir uma vulnerabilidade de segurança, **NÃO** abra uma issue pública. Em vez disso, envie um email para:

📧 **rodrigoapcampos92@gmail.com**

Com as seguintes informações:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)

Vou responder em até 48 horas.

---

## 🛡️ Práticas de Segurança Implementadas

### Backend
✅ **Validação de entrada** - Todos endpoints verificam campos obrigatórios e tipos  
✅ **Tratamento de erros** - Try-catch em todas operações críticas  
✅ **SQL Injection prevention** - Parametrized queries com SQLite  
✅ **CORS configurado** - Apenas frontend autorizado  
✅ **Soft delete** - Dados nunca são realmente deletados  
✅ **Audit trail** - Todos dados incluem timestamps  

### Banco de dados
✅ **SQLite com WAL mode** - Mais seguro e rápido  
✅ **Transações** - Integridade de dados garantida  
✅ **PRAGMA checks** - Validações automáticas  
✅ **Foreign keys** - Relacionamentos seguros  

### Frontend
✅ **Validação cliente-side** - Feedback imediato  
✅ **Confirmações** - Modais antes de operações críticas  
✅ **HTTPS ready** - Funciona com certificados SSL  
✅ **XSS protection** - React escapa automaticamente  

---

## 📋 Dependências

### Mantidas Atualizadas
Verificar regularmente:
```bash
npm outdated
npm audit
```

### Críticas para Monitorar
- sqlite3 (banco de dados)
- express (servidor)
- cors (segurança HTTP)
- uuid (geração IDs)

---

## 🔐 Boas Práticas para Produção

### Antes de Deploy

1. **Variáveis de ambiente**
   ```bash
   # Nunca commitar .env
   cp .env.example .env
   # Editar com valores reais
   ```

2. **Banco de dados**
   ```bash
   # Fazer backup
   cp backend/data/cabeleireiro.db backup/cabeleireiro.db.bak
   ```

3. **HTTPS/SSL**
   ```nginx
   # Exemplo nginx com SSL
   server {
       listen 443 ssl http2;
       ssl_certificate /etc/ssl/certs/seu_cert.crt;
       ssl_certificate_key /etc/ssl/private/sua_chave.key;
   }
   ```

4. **Rate limiting**
   ```javascript
   // Considerar adicionar em produção
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
   ```

---

## 🚨 Resposta a Incidentes

Caso uma vulnerabilidade seja descoberta:
1. **Patch** será desenvolvido imediatamente
2. **Release** será criado (security patch)
3. **Notificação** será enviada para usuários
4. **Débito de segurança** será documentado

---

## 📚 Referências de Segurança

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [SQLite Security](https://www.sqlite.org/security.html)

---

**Agradecemos pela sua ajuda em manter este projeto seguro!** 🙏
