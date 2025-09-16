import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Scale, AlertTriangle, Shield, FileText, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back-home">
                <ArrowLeft size={16} />
                <span>Voltar ao Início</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Scale className="text-primary" size={20} />
              <span className="text-lg font-semibold">Termos de Uso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-2" data-testid="text-terms-title">
              <Scale className="text-primary" />
              <span>Termos de Uso - JusValida</span>
            </CardTitle>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">Versão 1.0</Badge>
              <Badge variant="secondary">Vigente</Badge>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            
            {/* Acceptance */}
            <section>
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Aceitação dos Termos
                    </h2>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Ao criar uma conta e utilizar os serviços do JusValida, você aceita integralmente 
                      estes termos de uso e nossa Política de Privacidade. Estes documentos constituem 
                      um acordo legal vinculativo entre você e o JusValida.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Info */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-company-section">1. Identificação da Empresa</h2>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">JusValida - Análise Jurídica por IA</h3>
                <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
                <p><strong>Endereço:</strong> Av. Paulista, 1000 - 10º andar, Bela Vista, São Paulo - SP, CEP 01310-100</p>
                <p><strong>E-mail:</strong> contato@jusvalida.com.br</p>
                <p><strong>Telefone:</strong> +55 (11) 3000-0000</p>
              </div>
            </section>

            <Separator />

            {/* Services */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2" data-testid="text-services-section">
                <FileText className="text-primary" size={20} />
                <span>2. Descrição dos Serviços</span>
              </h2>
              
              <p className="mb-4 text-muted-foreground">
                O JusValida é uma plataforma digital que oferece análise automatizada de documentos jurídicos 
                utilizando inteligência artificial avançada.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg mb-2">2.1 Serviços Oferecidos</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Análise automatizada de contratos, petições e documentos jurídicos</li>
                    <li>• Identificação de falhas críticas e oportunidades de melhoria</li>
                    <li>• Verificação de compliance legal e regulamentário</li>
                    <li>• Relatórios detalhados com recomendações especializadas</li>
                    <li>• Análise de riscos jurídicos em documentos</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">2.2 Limitações dos Serviços</h3>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border-l-4 border-amber-500">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>IMPORTANTE:</strong> Os serviços do JusValida são ferramentas de apoio e não 
                      substituem o aconselhamento jurídico profissional. As análises são geradas por IA e 
                      podem conter imprecisões ou limitações. Recomendamos sempre a revisão por advogados 
                      qualificados antes de tomar decisões legais importantes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* User Eligibility */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-eligibility-section">3. Elegibilidade e Cadastro</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1 Requisitos para Uso</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Ter pelo menos 18 anos de idade</li>
                    <li>• Possuir capacidade jurídica plena</li>
                    <li>• Fornecer informações verdadeiras e atualizadas no cadastro</li>
                    <li>• Concordar com estes termos e a Política de Privacidade</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3.2 Responsabilidades do Usuário</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Manter suas credenciais de acesso seguras</li>
                    <li>• Não compartilhar sua conta com terceiros</li>
                    <li>• Notificar imediatamente sobre uso não autorizado</li>
                    <li>• Manter seus dados de cadastro atualizados</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Credits System */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2" data-testid="text-credits-section">
                <CreditCard className="text-primary" size={20} />
                <span>4. Sistema de Créditos</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">4.1 Funcionamento dos Créditos</h3>
                  <p className="text-muted-foreground mb-3">
                    Nossos serviços utilizam um sistema de créditos. Cada análise de documento consome 
                    uma quantidade específica de créditos baseada na complexidade e no provedor de IA utilizado.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="border border-border rounded p-3">
                      <h4 className="font-medium">Análise Geral</h4>
                      <p className="text-muted-foreground">1-3 créditos</p>
                    </div>
                    <div className="border border-border rounded p-3">
                      <h4 className="font-medium">Análise Especializada</h4>
                      <p className="text-muted-foreground">3-7 créditos</p>
                    </div>
                    <div className="border border-border rounded p-3">
                      <h4 className="font-medium">Análise Premium</h4>
                      <p className="text-muted-foreground">5-15 créditos</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4.2 Política de Créditos</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Créditos gratuitos: 10 créditos para novos usuários</li>
                    <li>• Validade: créditos não expiram enquanto a conta estiver ativa</li>
                    <li>• Reembolso: créditos não utilizados não são reembolsáveis</li>
                    <li>• Transferência: créditos não podem ser transferidos entre contas</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Usage Rules */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2" data-testid="text-usage-section">
                <Shield className="text-primary" size={20} />
                <span>5. Regras de Uso Aceitável</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2 text-green-700 dark:text-green-300">5.1 Usos Permitidos</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Análise de documentos jurídicos legítimos</li>
                    <li>• Revisão de contratos e petições próprias ou autorizadas</li>
                    <li>• Pesquisa e educação jurídica</li>
                    <li>• Uso profissional por advogados e escritórios</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-red-700 dark:text-red-300">5.2 Usos Proibidos</h3>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border-l-4 border-red-500">
                    <ul className="space-y-1 text-red-800 dark:text-red-200">
                      <li>• Análise de documentos obtidos ilegalmente</li>
                      <li>• Violação de confidencialidade ou sigilo profissional</li>
                      <li>• Uso para atividades fraudulentas ou ilegais</li>
                      <li>• Compartilhamento de documentos sigilosos sem autorização</li>
                      <li>• Tentativas de engenharia reversa da plataforma</li>
                      <li>• Spam, abuso ou uso excessivo dos recursos</li>
                      <li>• Criação de múltiplas contas para burlar limites</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-ip-section">6. Propriedade Intelectual</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">6.1 Propriedade do JusValida</h3>
                  <p className="text-muted-foreground">
                    Todos os direitos de propriedade intelectual sobre a plataforma, incluindo código, 
                    design, algoritmos, marca e conteúdo, pertencem ao JusValida ou seus licenciadores.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6.2 Seus Documentos</h3>
                  <p className="text-muted-foreground">
                    Você mantém todos os direitos sobre os documentos que carrega na plataforma. 
                    Concedemos apenas a licença necessária para processar e analisar seus arquivos, 
                    conforme descrito em nossa Política de Privacidade.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6.3 Relatórios e Análises</h3>
                  <p className="text-muted-foreground">
                    Os relatórios gerados pela nossa IA são de sua propriedade, mas podem conter 
                    elementos protegidos por direitos autorais do JusValida (formatação, metodologia, etc.).
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Liability */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-liability-section">7. Responsabilidades e Limitações</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">7.1 Natureza dos Serviços</h3>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>DISCLAMER IMPORTANTE:</strong> O JusValida fornece análises automatizadas 
                      baseadas em inteligência artificial. Estas análises são ferramentas de apoio e não 
                      constituem aconselhamento jurídico formal. Não garantimos a precisão absoluta das 
                      análises e recomendamos sempre validação por profissionais qualificados.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">7.2 Limitação de Responsabilidade</h3>
                  <p className="text-muted-foreground mb-3">
                    Nossa responsabilidade está limitada ao valor pago pelos serviços no período de 
                    12 meses anteriores ao evento. Não nos responsabilizamos por:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Decisões tomadas com base nas análises</li>
                    <li>• Danos indiretos ou consequenciais</li>
                    <li>• Perda de lucros ou oportunidades</li>
                    <li>• Falhas em decisões judiciais ou administrativas</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Data Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-privacy-section">8. Proteção de Dados e Privacidade</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">8.1 Compromisso com a LGPD</h3>
                  <p className="text-muted-foreground">
                    Levamos a proteção de dados pessoais muito a sério e cumprimos integralmente a 
                    Lei Geral de Proteção de Dados (LGPD). Para detalhes completos, consulte nossa 
                    <Link href="/privacy-policy" className="text-primary hover:underline ml-1">
                      Política de Privacidade
                    </Link>.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">8.2 Confidencialidade</h3>
                  <p className="text-muted-foreground">
                    Implementamos medidas técnicas e organizacionais adequadas para proteger a 
                    confidencialidade dos documentos analisados. Nossos funcionários e prestadores 
                    estão sujeitos a rigorosos acordos de confidencialidade.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-termination-section">9. Encerramento da Conta</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">9.1 Encerramento pelo Usuário</h3>
                  <p className="text-muted-foreground">
                    Você pode encerrar sua conta a qualquer momento através das configurações da conta 
                    ou entrando em contato conosco. Créditos não utilizados não são reembolsáveis.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">9.2 Encerramento pelo JusValida</h3>
                  <p className="text-muted-foreground mb-3">
                    Podemos suspender ou encerrar contas em caso de violação destes termos, incluindo:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Uso indevido da plataforma</li>
                    <li>• Atividades fraudulentas ou ilegais</li>
                    <li>• Violação de direitos de terceiros</li>
                    <li>• Não pagamento de valores devidos</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-changes-section">10. Alterações nos Termos</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Podemos atualizar estes termos periodicamente para refletir mudanças em nossos 
                  serviços, legislação aplicável ou práticas empresariais.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Processo de Notificação</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Notificação por e-mail para alterações significativas</li>
                    <li>• Aviso na plataforma por 30 dias</li>
                    <li>• Entrada em vigor após 30 dias da notificação</li>
                    <li>• Direito de encerrar a conta antes da vigência</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-law-section">11. Lei Aplicável e Foro</h2>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Lei Aplicável</h4>
                    <p className="text-sm text-muted-foreground">
                      Estes termos são regidos pela legislação brasileira, especialmente:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Código de Defesa do Consumidor (Lei 8.078/90)</li>
                      <li>• Lei Geral de Proteção de Dados (Lei 13.709/18)</li>
                      <li>• Marco Civil da Internet (Lei 12.965/14)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Foro Competente</h4>
                    <p className="text-sm text-muted-foreground">
                      Fica eleito o foro da Comarca de São Paulo - SP para dirimir quaisquer 
                      controvérsias decorrentes destes termos, renunciando as partes a qualquer outro.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-contact-section">12. Contato</h2>
              
              <div className="bg-muted p-6 rounded-lg">
                <p className="mb-4">
                  Para dúvidas, sugestões ou exercício de direitos relacionados a estes termos, 
                  entre em contato conosco:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium">Atendimento Geral</h4>
                    <p>📧 contato@jusvalida.com.br</p>
                    <p>📞 +55 (11) 3000-0000</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Questões Legais e Privacidade</h4>
                    <p>📧 dpo@jusvalida.com.br</p>
                    <p>📞 +55 (11) 3000-0001</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Horário de atendimento:</strong> Segunda a sexta, das 9h às 18h (horário de Brasília)
                  </p>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}