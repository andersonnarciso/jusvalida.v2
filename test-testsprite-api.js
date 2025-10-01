#!/usr/bin/env node

import http from 'http';

const API_BASE = 'http://localhost:5000/api/testsprite';

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Testes da API
async function testTestSpriteAPI() {
  console.log('🧪 Testando API do TestSprite...\n');

  try {
    // 1. Testar configuração
    console.log('1. Testando endpoint de configuração...');
    const configResponse = await makeRequest('GET', '/api/testsprite/config');
    console.log('✅ Configuração:', configResponse.status === 200 ? 'OK' : 'ERRO');
    if (configResponse.status === 200) {
      console.log('   - Projeto:', configResponse.data.config?.project?.name);
      console.log('   - Playwright configurado:', configResponse.data.config?.playwright?.configured);
      console.log('   - Jest configurado:', configResponse.data.config?.jest?.configured);
    }

    // 2. Testar execução de teste
    console.log('\n2. Testando execução de teste...');
    const testData = {
      testType: 'e2e',
      browser: 'chromium',
      headless: true,
      timeout: 60000
    };
    
    const executeResponse = await makeRequest('POST', '/api/testsprite/execute', testData);
    console.log('✅ Execução:', executeResponse.status === 200 ? 'OK' : 'ERRO');
    
    if (executeResponse.status === 200) {
      const testId = executeResponse.data.testId;
      console.log('   - Test ID:', testId);
      
      // 3. Verificar status do teste
      console.log('\n3. Verificando status do teste...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
      
      const statusResponse = await makeRequest('GET', `/api/testsprite/status/${testId}`);
      console.log('✅ Status:', statusResponse.status === 200 ? 'OK' : 'ERRO');
      if (statusResponse.status === 200) {
        console.log('   - Status:', statusResponse.data.test?.status);
        console.log('   - Timestamp:', statusResponse.data.test?.timestamp);
      }

      // 4. Listar todos os testes
      console.log('\n4. Listando todos os testes...');
      const listResponse = await makeRequest('GET', '/api/testsprite/tests');
      console.log('✅ Lista:', listResponse.status === 200 ? 'OK' : 'ERRO');
      if (listResponse.status === 200) {
        console.log('   - Total de testes:', listResponse.data.total);
      }

      // 5. Testar cancelamento (se o teste ainda estiver rodando)
      if (statusResponse.data?.test?.status === 'running') {
        console.log('\n5. Testando cancelamento...');
        const cancelResponse = await makeRequest('POST', `/api/testsprite/cancel/${testId}`);
        console.log('✅ Cancelamento:', cancelResponse.status === 200 ? 'OK' : 'ERRO');
      }

      // 6. Testar relatórios
      console.log('\n6. Testando relatórios...');
      const reportsResponse = await makeRequest('GET', `/api/testsprite/reports/${testId}`);
      console.log('✅ Relatórios:', reportsResponse.status === 200 ? 'OK' : 'ERRO');
      if (reportsResponse.status === 200) {
        console.log('   - Relatórios disponíveis:', reportsResponse.data.reports?.length || 0);
      }
    }

    // 7. Testar limpeza
    console.log('\n7. Testando limpeza...');
    const cleanupResponse = await makeRequest('DELETE', '/api/testsprite/cleanup');
    console.log('✅ Limpeza:', cleanupResponse.status === 200 ? 'OK' : 'ERRO');
    if (cleanupResponse.status === 200) {
      console.log('   - Testes removidos:', cleanupResponse.data.cleaned);
    }

    console.log('\n🎉 Testes da API concluídos!');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:5000');
    console.log('   Execute: npm run dev');
  }
}

// Executar testes
testTestSpriteAPI();
