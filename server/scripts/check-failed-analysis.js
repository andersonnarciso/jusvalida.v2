import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFailedAnalysis() {
  try {
    console.log('🔍 Verificando análise que falhou...');
    
    // Get the failed analysis
    const { data: analysis, error } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('status', 'failed')
      .single();
    
    if (error) {
      console.log(`❌ Erro ao buscar análise: ${error.message}`);
      return;
    }
    
    if (!analysis) {
      console.log('✅ Nenhuma análise com status "failed" encontrada');
      return;
    }
    
    console.log('\n📄 Detalhes da análise que falhou:');
    console.log(`   ID: ${analysis.id}`);
    console.log(`   Título: ${analysis.title}`);
    console.log(`   Status: ${analysis.status}`);
    console.log(`   Usuário: ${analysis.user_id}`);
    console.log(`   Criado: ${new Date(analysis.created_at).toLocaleString('pt-BR')}`);
    console.log(`   Atualizado: ${new Date(analysis.updated_at).toLocaleString('pt-BR')}`);
    
    if (analysis.error_message) {
      console.log(`\n❌ Mensagem de erro:`);
      console.log(`   ${analysis.error_message}`);
    }
    
    if (analysis.result) {
      console.log(`\n📊 Resultado (parcial):`);
      try {
        const result = typeof analysis.result === 'string' ? JSON.parse(analysis.result) : analysis.result;
        console.log(`   ${JSON.stringify(result, null, 2)}`);
      } catch (e) {
        console.log(`   ${analysis.result}`);
      }
    }
    
    if (analysis.document_content) {
      console.log(`\n📝 Conteúdo do documento (primeiros 200 caracteres):`);
      console.log(`   ${analysis.document_content.substring(0, 200)}...`);
    }
    
    if (analysis.ai_provider) {
      console.log(`\n🤖 Provedor AI: ${analysis.ai_provider}`);
    }
    
    if (analysis.template_id) {
      console.log(`\n📋 Template: ${analysis.template_id}`);
    }
    
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar se o provedor AI está configurado corretamente');
    console.log('   2. Verificar se há créditos suficientes');
    console.log('   3. Verificar se o template existe');
    console.log('   4. Verificar logs do servidor para mais detalhes');
    
  } catch (error) {
    console.error('❌ Error checking failed analysis:', error);
  }
}

checkFailedAnalysis();
