import type { Express } from "express";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Schemas de validação
const testExecutionSchema = z.object({
  testType: z.enum(['unit', 'e2e', 'all']).default('all'),
  testFile: z.string().optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit', 'all']).default('all'),
  headless: z.boolean().default(true),
  timeout: z.number().default(300000), // 5 minutos
  reporter: z.enum(['list', 'html', 'json', 'junit']).default('list')
});

const testResultSchema = z.object({
  testId: z.string(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  results: z.object({
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    total: z.number(),
    duration: z.number()
  }).optional(),
  output: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string()
});

// Store para testes em execução
const runningTests = new Map<string, any>();

export function setupTestSpriteRoutes(app: Express) {
  // Endpoint para executar testes
  app.post('/api/testsprite/execute', async (req, res) => {
    try {
      const validatedData = testExecutionSchema.parse(req.body);
      const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Inicializar status do teste
      runningTests.set(testId, {
        testId,
        status: 'running',
        timestamp: new Date().toISOString(),
        config: validatedData
      });

      // Executar teste em background
      executeTest(testId, validatedData);

      res.json({
        success: true,
        testId,
        message: 'Teste iniciado com sucesso',
        status: 'running'
      });

    } catch (error) {
      console.error('Erro ao executar teste:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Endpoint para verificar status do teste
  app.get('/api/testsprite/status/:testId', (req, res) => {
    const { testId } = req.params;
    const test = runningTests.get(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Teste não encontrado'
      });
    }

    res.json({
      success: true,
      test
    });
  });

  // Endpoint para listar todos os testes
  app.get('/api/testsprite/tests', (req, res) => {
    const tests = Array.from(runningTests.values());
    res.json({
      success: true,
      tests,
      total: tests.length
    });
  });

  // Endpoint para cancelar teste
  app.post('/api/testsprite/cancel/:testId', (req, res) => {
    const { testId } = req.params;
    const test = runningTests.get(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Teste não encontrado'
      });
    }

    if (test.status === 'running') {
      test.status = 'cancelled';
      test.timestamp = new Date().toISOString();
      
      // Tentar parar o processo se existir
      if (test.process) {
        try {
          test.process.kill();
        } catch (error) {
          console.error('Erro ao cancelar processo:', error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Teste cancelado com sucesso'
    });
  });

  // Endpoint para obter relatórios de teste
  app.get('/api/testsprite/reports/:testId', (req, res) => {
    const { testId } = req.params;
    const test = runningTests.get(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Teste não encontrado'
      });
    }

    // Verificar se existem relatórios
    const reportPaths = [
      'test-results/results.json',
      'test-results/results.xml',
      'playwright-report/index.html'
    ];

    const reports = reportPaths.filter(reportPath => 
      fs.existsSync(path.join(process.cwd(), reportPath))
    );

    res.json({
      success: true,
      testId,
      reports: reports.map(reportPath => ({
        type: path.extname(reportPath).substring(1),
        path: reportPath,
        url: `/api/testsprite/reports/${testId}/file/${path.basename(reportPath)}`
      }))
    });
  });

  // Endpoint para servir arquivos de relatório
  app.get('/api/testsprite/reports/:testId/file/:filename', (req, res) => {
    const { testId, filename } = req.params;
    
    // Verificar se o teste existe
    const test = runningTests.get(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Teste não encontrado'
      });
    }

    // Determinar o caminho do arquivo
    let filePath: string;
    if (filename === 'results.json') {
      filePath = path.join(process.cwd(), 'test-results/results.json');
    } else if (filename === 'results.xml') {
      filePath = path.join(process.cwd(), 'test-results/results.xml');
    } else if (filename === 'index.html') {
      filePath = path.join(process.cwd(), 'playwright-report/index.html');
    } else {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de relatório não encontrado'
      });
    }

    // Servir o arquivo
    res.sendFile(filePath);
  });

  // Endpoint para obter configuração do projeto
  app.get('/api/testsprite/config', (req, res) => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const playwrightConfig = fs.existsSync('playwright.config.ts') ? 
        fs.readFileSync('playwright.config.ts', 'utf8') : null;
      const jestConfig = fs.existsSync('jest.config.mjs') ? 
        fs.readFileSync('jest.config.mjs', 'utf8') : null;

      res.json({
        success: true,
        config: {
          project: {
            name: packageJson.name,
            version: packageJson.version,
            scripts: packageJson.scripts
          },
          playwright: {
            configured: !!playwrightConfig,
            config: playwrightConfig
          },
          jest: {
            configured: !!jestConfig,
            config: jestConfig
          },
          testFiles: getTestFiles()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao obter configuração'
      });
    }
  });

  // Endpoint para limpar testes antigos
  app.delete('/api/testsprite/cleanup', (req, res) => {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
    
    let cleaned = 0;
    for (const [testId, test] of runningTests.entries()) {
      const testTime = new Date(test.timestamp);
      if (testTime < cutoffTime || test.status === 'completed' || test.status === 'failed') {
        runningTests.delete(testId);
        cleaned++;
      }
    }

    res.json({
      success: true,
      message: `${cleaned} testes antigos removidos`,
      cleaned
    });
  });
}

// Função para executar teste em background
function executeTest(testId: string, config: any) {
  const test = runningTests.get(testId);
  if (!test) return;

  try {
    let command: string;
    let args: string[];

    if (config.testType === 'unit') {
      command = 'npm';
      args = ['run', 'test'];
    } else if (config.testType === 'e2e') {
      command = 'npx';
      args = ['playwright', 'test'];
      
      if (config.browser !== 'all') {
        args.push('--project', config.browser);
      }
      
      if (config.headless) {
        args.push('--headed=false');
      }
      
      args.push('--reporter', config.reporter);
    } else {
      // all tests
      command = 'npm';
      args = ['run', 'test:all'];
    }

    if (config.testFile) {
      args.push(config.testFile);
    }

    console.log(`Executando teste ${testId}: ${command} ${args.join(' ')}`);

    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    test.process = process;
    let output = '';
    let errorOutput = '';

    process.stdout?.on('data', (data) => {
      output += data.toString();
    });

    process.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      test.status = code === 0 ? 'completed' : 'failed';
      test.timestamp = new Date().toISOString();
      test.output = output;
      test.error = errorOutput;
      test.results = parseTestResults(output, code === 0);
      
      console.log(`Teste ${testId} finalizado com status: ${test.status}`);
    });

    process.on('error', (error) => {
      test.status = 'failed';
      test.timestamp = new Date().toISOString();
      test.error = error.message;
      console.error(`Erro no teste ${testId}:`, error);
    });

    // Timeout
    setTimeout(() => {
      if (test.status === 'running') {
        test.status = 'failed';
        test.timestamp = new Date().toISOString();
        test.error = 'Timeout - teste excedeu o tempo limite';
        if (test.process) {
          test.process.kill();
        }
      }
    }, config.timeout);

  } catch (error) {
    test.status = 'failed';
    test.timestamp = new Date().toISOString();
    test.error = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao executar teste ${testId}:`, error);
  }
}

// Função para obter arquivos de teste
function getTestFiles(): string[] {
  const testFiles: string[] = [];
  
  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
        testFiles.push(filePath);
      }
    });
  }

  scanDirectory('tests');
  scanDirectory('client/src');
  
  return testFiles;
}

// Função para parsear resultados dos testes
function parseTestResults(output: string, success: boolean): any {
  try {
    // Tentar extrair informações dos resultados
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let total = 0;
    let duration = 0;

    for (const line of lines) {
      // Jest results
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed, (\d+) failed, (\d+) total/);
        if (match) {
          passed = parseInt(match[1]);
          failed = parseInt(match[2]);
          total = parseInt(match[3]);
        }
      }
      
      // Playwright results
      if (line.includes('Running')) {
        const match = line.match(/(\d+) test/);
        if (match) {
          total = parseInt(match[1]);
        }
      }
      
      if (line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) {
          passed = parseInt(match[1]);
        }
      }
      
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) {
          failed = parseInt(match[1]);
        }
      }
      
      if (line.includes('skipped')) {
        const match = line.match(/(\d+) skipped/);
        if (match) {
          skipped = parseInt(match[1]);
        }
      }
      
      // Duration
      const durationMatch = line.match(/(\d+(?:\.\d+)?)s/);
      if (durationMatch) {
        duration = parseFloat(durationMatch[1]) * 1000; // Convert to milliseconds
      }
    }

    return {
      passed,
      failed,
      skipped,
      total: total || (passed + failed + skipped),
      duration
    };
  } catch (error) {
    return {
      passed: success ? 1 : 0,
      failed: success ? 0 : 1,
      skipped: 0,
      total: 1,
      duration: 0
    };
  }
}







