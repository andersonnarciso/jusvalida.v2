# Configuração do Stripe - Variáveis de Ambiente

## 🚀 Configuração no Netlify

### 1. Acesse o Netlify Dashboard
1. Vá para [netlify.com](https://netlify.com)
2. Selecione seu projeto `jusvalida`
3. Vá em **Site settings** → **Environment variables**

### 2. Adicione as seguintes variáveis:

```bash
# Stripe Configuration (Produção)
STRIPE_IS_ACTIVE=true
STRIPE_OPERATION_MODE=live
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Valores das Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `STRIPE_IS_ACTIVE` | Ativa/desativa o Stripe | `true` |
| `STRIPE_OPERATION_MODE` | Modo de operação | `live` ou `test` |
| `STRIPE_LIVE_SECRET_KEY` | Chave secreta de produção | `sk_live_...` |
| `STRIPE_TEST_SECRET_KEY` | Chave secreta de teste | `sk_test_...` |
| `STRIPE_PUBLIC_KEY` | Chave pública | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook | `whsec_...` |

## 🔧 Configuração do Webhook

### URL do Webhook:
```
https://app.jusvalida.com.br/api/stripe/webhook
```

### Eventos Recomendados:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.created`
- `customer.updated`

## 📋 Vantagens desta Abordagem

✅ **Segurança**: Chaves não ficam no código
✅ **Flexibilidade**: Fácil mudança entre test/live
✅ **Manutenção**: Configuração centralizada
✅ **Deploy**: Não precisa recompilar para mudar chaves

## 🔄 Fallback

O sistema tem fallback automático:
1. **Primeiro**: Tenta usar variáveis de ambiente
2. **Segundo**: Usa configuração do banco de dados
3. **Erro**: Se nenhuma configuração for encontrada

## 🚨 Importante

- Use `STRIPE_OPERATION_MODE=live` para produção
- Use `STRIPE_OPERATION_MODE=test` para desenvolvimento
- As chaves devem ser obtidas do [Stripe Dashboard](https://dashboard.stripe.com)
- O webhook secret é gerado quando você cria o webhook no Stripe
