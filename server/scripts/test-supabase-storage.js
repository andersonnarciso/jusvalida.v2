import { storage } from '../storage-supabase.ts';

async function testSupabaseStorage() {
  try {
    console.log('🧪 Testando Supabase Storage...');
    
    const result = await storage.getAllUsers(1, 10);
    
    console.log('✅ Storage funcionando!');
    console.log(`   Total de usuários: ${result.total}`);
    console.log(`   Usuários retornados: ${result.users.length}`);
    
    result.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.credits} créditos`);
    });
    
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ O servidor deve funcionar agora!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSupabaseStorage();
