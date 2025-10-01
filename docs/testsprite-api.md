# TestSprite API - Documentação

Esta API permite executar e gerenciar testes do projeto JusValida de forma programática, substituindo a necessidade do pacote `@testsprite/testsprite-mcp` que apresenta problemas de compatibilidade.

## Endpoints Disponíveis

### 1. Executar Testes

**POST** `/api/testsprite/execute`

Executa testes do projeto.

#### Parâmetros

```json
{
  "testType": "unit" | "e2e" | "all",
  "testFile": "string (opcional)",
  "browser": "chromium" | "firefox" | "webkit" | "all",
  "headless": boolean,
  "timeout": number,
  "reporter": "list" | "html" | "json" | "junit"
}
```

#### Exemplo de Requisição

```bash
curl -X POST http://localhost:5000/api/testsprite/execute \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "e2e",
    "browser": "chromium",
    "headless": true,
    "timeout": 300000
  }'
```

#### Resposta

```json
{
  "success": true,
  "testId": "test_1696123456789_abc123def",
  "message": "Teste iniciado com sucesso",
  "status": "running"
}
```

### 2. Verificar Status do Teste

**GET** `/api/testsprite/status/:testId`

Verifica o status de um teste específico.

#### Exemplo de Requisição

```bash
curl http://localhost:5000/api/testsprite/status/test_1696123456789_abc123def
```

#### Resposta

```json
{
  "success": true,
  "test": {
    "testId": "test_1696123456789_abc123def",
    "status": "completed",
    "timestamp": "2023-09-30T20:30:00.000Z",
    "results": {
      "passed": 5,
      "failed": 0,
      "skipped": 1,
      "total": 6,
      "duration": 45000
    },
    "output": "Test execution output...",
    "error": null
  }
}
```

### 3. Listar Todos os Testes

**GET** `/api/testsprite/tests`

Lista todos os testes executados.

#### Resposta

```json
{
  "success": true,
  "tests": [
    {
      "testId": "test_1696123456789_abc123def",
      "status": "completed",
      "timestamp": "2023-09-30T20:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 4. Cancelar Teste

**POST** `/api/testsprite/cancel/:testId`

Cancela um teste em execução.

#### Resposta

```json
{
  "success": true,
  "message": "Teste cancelado com sucesso"
}
```

### 5. Obter Relatórios

**GET** `/api/testsprite/reports/:testId`

Lista os relatórios disponíveis para um teste.

#### Resposta

```json
{
  "success": true,
  "testId": "test_1696123456789_abc123def",
  "reports": [
    {
      "type": "json",
      "path": "test-results/results.json",
      "url": "/api/testsprite/reports/test_1696123456789_abc123def/file/results.json"
    },
    {
      "type": "html",
      "path": "playwright-report/index.html",
      "url": "/api/testsprite/reports/test_1696123456789_abc123def/file/index.html"
    }
  ]
}
```

### 6. Servir Arquivo de Relatório

**GET** `/api/testsprite/reports/:testId/file/:filename`

Serve um arquivo de relatório específico.

#### Exemplo

```bash
curl http://localhost:5000/api/testsprite/reports/test_1696123456789_abc123def/file/results.json
```

### 7. Obter Configuração

**GET** `/api/testsprite/config`

Retorna a configuração do projeto.

#### Resposta

```json
{
  "success": true,
  "config": {
    "project": {
      "name": "rest-express",
      "version": "1.0.0",
      "scripts": {
        "test": "jest --config jest.config.mjs",
        "test:e2e": "playwright test"
      }
    },
    "playwright": {
      "configured": true,
      "config": "playwright config content..."
    },
    "jest": {
      "configured": true,
      "config": "jest config content..."
    },
    "testFiles": [
      "tests/e2e/auth.spec.ts",
      "tests/e2e/dashboard.spec.ts"
    ]
  }
}
```

### 8. Limpar Testes Antigos

**DELETE** `/api/testsprite/cleanup`

Remove testes antigos (mais de 24 horas).

#### Resposta

```json
{
  "success": true,
  "message": "5 testes antigos removidos",
  "cleaned": 5
}
```

## Status dos Testes

- `running`: Teste em execução
- `completed`: Teste concluído com sucesso
- `failed`: Teste falhou
- `cancelled`: Teste cancelado

## Tipos de Teste

- `unit`: Testes unitários (Jest)
- `e2e`: Testes end-to-end (Playwright)
- `all`: Todos os testes

## Browsers Suportados

- `chromium`: Google Chrome
- `firefox`: Mozilla Firefox
- `webkit`: Safari
- `all`: Todos os browsers

## Reporters Disponíveis

- `list`: Lista simples
- `html`: Relatório HTML
- `json`: Relatório JSON
- `junit`: Relatório JUnit XML

## Exemplo de Uso Completo

```javascript
// 1. Executar teste
const response = await fetch('http://localhost:5000/api/testsprite/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    testType: 'e2e',
    browser: 'chromium',
    headless: true
  })
});

const { testId } = await response.json();

// 2. Aguardar conclusão
let status = 'running';
while (status === 'running') {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const statusResponse = await fetch(`http://localhost:5000/api/testsprite/status/${testId}`);
  const { test } = await statusResponse.json();
  status = test.status;
}

// 3. Obter resultados
if (status === 'completed') {
  const reportsResponse = await fetch(`http://localhost:5000/api/testsprite/reports/${testId}`);
  const { reports } = await reportsResponse.json();
  
  console.log('Relatórios disponíveis:', reports);
}
```

## Solução para o Problema do punycode.js

Esta API resolve o problema de compatibilidade do `@testsprite/testsprite-mcp` com Node.js v20, fornecendo uma interface REST para execução de testes sem dependências problemáticas.

## Testando a API

Execute o script de teste:

```bash
node test-testsprite-api.js
```

Certifique-se de que o servidor está rodando:

```bash
npm run dev
```









