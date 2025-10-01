# Guia de Migração: Neon → Supabase

## 📋 Pré-requisitos

1. **Conta Supabase**: Crie uma conta em [supabase.com](https://supabase.com)
2. **Projeto Supabase**: Crie um novo projeto no dashboard do Supabase
3. **Credenciais**: Anote as credenciais do projeto

## 🔧 Passo 1: Configurar Projeto Supabase

### 1.1 Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha sua organização
4. Configure:
   - **Name**: `jusvalida`
   - **Database Password**: (anote esta senha!)
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)

### 1.2 Obter Credenciais
No dashboard do projeto, vá em **Settings > API**:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗄️ Passo 2: Configurar Schema no Supabase

### 2.1 Executar SQL no Supabase
No dashboard do Supabase, vá em **SQL Editor** e execute:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schema (será executado pelo Drizzle)
-- O schema será criado automaticamente quando executarmos as migrações
```

### 2.2 Configurar RLS (Row Level Security)
```sql
-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (serão refinadas depois)
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = supabase_id);

CREATE POLICY "Users can view own analyses" ON document_analyses
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR ALL USING (auth.uid()::text = user_id);
```

## ⚙️ Passo 3: Atualizar Configurações

### 3.1 Criar arquivo .env
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (usar a URL do Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Encryption (manter a mesma)
ENCRYPTION_KEY=your-encryption-key-here
```

### 3.2 Atualizar drizzle.config.ts
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

## 🚀 Passo 4: Executar Migração

### 4.1 Gerar Migrações
```bash
npx drizzle-kit generate
```

### 4.2 Executar Migrações
```bash
npx drizzle-kit migrate
```

### 4.3 Verificar Schema
```bash
npx drizzle-kit studio
```

## 👤 Passo 5: Configurar Usuário Admin

### 5.1 Criar usuário no Supabase Auth
1. No dashboard do Supabase, vá em **Authentication > Users**
2. Clique em "Add user"
3. Configure:
   - **Email**: seu email
   - **Password**: senha forte
   - **Auto Confirm User**: ✅

### 5.2 Definir Role Admin
1. Clique no usuário criado
2. Em **Raw user meta data**, adicione:
```json
{
  "role": "admin"
}
```

### 5.3 Sincronizar com tabela users
Execute o script de setup:
```bash
node server/scripts/setup-admin-user.js
```

## ✅ Passo 6: Testar Conexão

### 6.1 Testar Build
```bash
npm run build
```

### 6.2 Testar Local
```bash
npm run dev
```

### 6.3 Verificar no Dashboard
- Acesse o dashboard do Supabase
- Verifique se as tabelas foram criadas
- Confirme se o usuário admin aparece na tabela `users`

## 🔄 Passo 7: Deploy

### 7.1 Configurar Variáveis no Netlify
No dashboard do Netlify, vá em **Site settings > Environment variables** e adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `DATABASE_URL`
- `ENCRYPTION_KEY`

### 7.2 Deploy
```bash
git add .
git commit -m "feat: Migrar de Neon para Supabase"
git push origin main
```

## 🎯 Benefícios da Migração

1. **Autenticação Integrada**: Supabase Auth nativo
2. **RLS (Row Level Security)**: Segurança a nível de linha
3. **Real-time**: Atualizações em tempo real
4. **Storage**: Armazenamento de arquivos integrado
5. **Edge Functions**: Serverless functions
6. **Dashboard**: Interface administrativa completa

## 🚨 Notas Importantes

- **Backup**: Faça backup dos dados antes da migração
- **Testes**: Teste todas as funcionalidades após a migração
- **RLS**: Configure políticas de segurança adequadas
- **Performance**: Monitore performance após a migração
