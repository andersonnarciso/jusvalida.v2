# Configuração de Variáveis de Ambiente

## 📝 Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```bash
# Supabase Configuration
# Get these from your Supabase project dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (use Supabase PostgreSQL)
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Encryption Key (keep your existing key)
ENCRYPTION_KEY=your-encryption-key-here

# Optional: SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔑 Como obter as credenciais do Supabase

### 1. Acesse o Dashboard do Supabase
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione seu projeto (ou crie um novo)

### 2. Obtenha as credenciais
- Vá em **Settings > API**
- Copie:
  - **Project URL** → `VITE_SUPABASE_URL`
  - **anon public** → `VITE_SUPABASE_ANON_KEY`
  - **service_role** → `SUPABASE_SERVICE_KEY`

### 3. Obtenha a URL do banco
- Vá em **Settings > Database**
- Copie a **Connection string**
- Use como `DATABASE_URL`

## ⚠️ Importante

- **Nunca** commite o arquivo `.env` para o Git
- Mantenha suas chaves seguras
- Use variáveis de ambiente no Netlify para produção
