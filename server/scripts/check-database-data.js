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

async function checkDatabaseData() {
  try {
    console.log('🔍 Verificando dados no banco do Supabase...');
    
    // Check users table
    console.log('\n👥 Tabela USERS:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.log(`   ❌ Erro: ${usersError.message}`);
    } else {
      console.log(`   📊 Total: ${users.length} usuários`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.credits} créditos`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        if (user.supabase_id) {
          console.log(`      Supabase ID: ${user.supabase_id}`);
        }
        console.log('');
      });
    }
    
    // Check document_analyses table
    console.log('\n📄 Tabela DOCUMENT_ANALYSES:');
    const { data: analyses, error: analysesError } = await supabase
      .from('document_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (analysesError) {
      console.log(`   ❌ Erro: ${analysesError.message}`);
    } else {
      console.log(`   📊 Total: ${analyses.length} análises (mostrando últimas 10)`);
      analyses.forEach((analysis, index) => {
        console.log(`   ${index + 1}. ${analysis.title || 'Sem título'}`);
        console.log(`      Status: ${analysis.status}`);
        console.log(`      Usuário: ${analysis.user_id}`);
        console.log(`      Criado: ${new Date(analysis.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Check credit_transactions table
    console.log('\n💰 Tabela CREDIT_TRANSACTIONS:');
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transactionsError) {
      console.log(`   ❌ Erro: ${transactionsError.message}`);
    } else {
      console.log(`   📊 Total: ${transactions.length} transações (mostrando últimas 10)`);
      transactions.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ${transaction.type} - ${transaction.amount} créditos`);
        console.log(`      Descrição: ${transaction.description}`);
        console.log(`      Usuário: ${transaction.user_id}`);
        console.log(`      Data: ${new Date(transaction.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Check ai_providers table
    console.log('\n🤖 Tabela AI_PROVIDERS:');
    const { data: providers, error: providersError } = await supabase
      .from('ai_providers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (providersError) {
      console.log(`   ❌ Erro: ${providersError.message}`);
    } else {
      console.log(`   📊 Total: ${providers.length} provedores AI`);
      providers.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.provider} (${provider.is_active ? 'Ativo' : 'Inativo'})`);
        console.log(`      Usuário: ${provider.user_id}`);
        console.log(`      Criado: ${new Date(provider.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Check system_ai_providers table
    console.log('\n⚙️ Tabela SYSTEM_AI_PROVIDERS:');
    const { data: systemProviders, error: systemProvidersError } = await supabase
      .from('system_ai_providers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (systemProvidersError) {
      console.log(`   ❌ Erro: ${systemProvidersError.message}`);
    } else {
      console.log(`   📊 Total: ${systemProviders.length} provedores AI do sistema`);
      systemProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.provider} (${provider.is_active ? 'Ativo' : 'Inativo'})`);
        console.log(`      Criado: ${new Date(provider.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Check document_templates table
    console.log('\n📋 Tabela DOCUMENT_TEMPLATES:');
    const { data: templates, error: templatesError } = await supabase
      .from('document_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (templatesError) {
      console.log(`   ❌ Erro: ${templatesError.message}`);
    } else {
      console.log(`   📊 Total: ${templates.length} templates`);
      templates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} (${template.category})`);
        console.log(`      ID: ${template.template_id}`);
        console.log(`      Ativo: ${template.is_active ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }
    
    // Check support_tickets table
    console.log('\n🎫 Tabela SUPPORT_TICKETS:');
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ticketsError) {
      console.log(`   ❌ Erro: ${ticketsError.message}`);
    } else {
      console.log(`   📊 Total: ${tickets.length} tickets (mostrando últimos 10)`);
      tickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ${ticket.subject} (${ticket.status})`);
        console.log(`      Usuário: ${ticket.user_id}`);
        console.log(`      Prioridade: ${ticket.priority}`);
        console.log(`      Criado: ${new Date(ticket.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    console.log('✅ Verificação de dados concluída!');
    
  } catch (error) {
    console.error('❌ Error checking database data:', error);
  }
}

checkDatabaseData();
