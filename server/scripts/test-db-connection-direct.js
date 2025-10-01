import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Testando conexão direta com PostgreSQL...');
console.log('DATABASE_URL:', databaseUrl ? 'Definida' : 'Não definida');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não definida');
  process.exit(1);
}

async function testDirectConnection() {
  try {
    console.log('\n1. Criando conexão com PostgreSQL...');
    
    const sql = postgres(databaseUrl, { max: 1 });
    
    console.log('2. Testando query simples...');
    
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    
    console.log('✅ Conexão bem-sucedida!');
    console.log(`   Usuários no banco: ${result[0].count}`);
    
    // Test with a more complex query
    console.log('\n3. Testando query de usuários...');
    
    const users = await sql`
      SELECT id, email, first_name, last_name, role, credits 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log(`   Encontrados ${users.length} usuários:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.credits} créditos`);
    });
    
    await sql.end();
    
    console.log('\n🎉 Teste de conexão direta concluído com sucesso!');
    console.log('✅ O servidor deve funcionar agora!');
    
  } catch (error) {
    console.error('❌ Erro na conexão direta:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se a senha do banco está correta');
    console.log('2. Verificar se o banco está acessível');
    console.log('3. Verificar se a URL está completa');
  }
}

testDirectConnection();
