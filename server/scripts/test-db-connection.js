import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Testando configuração do banco de dados...');
console.log('DATABASE_URL:', databaseUrl ? 'Definida' : 'Não definida');
console.log('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('SERVICE_KEY:', supabaseServiceKey ? 'Definida' : 'Não definida');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  try {
    console.log('\n1. Testando conexão com Supabase...');
    
    // Test Supabase connection
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Supabase connection failed:', usersError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log(`   Found ${users.users.length} users in Supabase Auth`);
    
    // Test database connection via Supabase
    console.log('\n2. Testando conexão com banco de dados...');
    
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError);
      console.log('\n🔧 Possíveis soluções:');
      console.log('1. Verificar se a senha do banco está correta');
      console.log('2. Verificar se o banco está acessível');
      console.log('3. Verificar se as permissões estão corretas');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test with a simple query
    console.log('\n3. Testando query simples...');
    
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (testError) {
      console.error('❌ Query failed:', testError);
    } else {
      console.log('✅ Query successful');
      console.log(`   Found ${testData.length} users in database`);
      testData.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
      });
    }
    
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
  }
}

testDatabaseConnection();
