import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Mail, Phone, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
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
              <Shield className="text-primary" size={20} />
              <span className="text-lg font-semibold">Política de Privacidade</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-policy-title">
              Política de Privacidade - JusValida
            </CardTitle>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            
            {/* Identificação do Controlador - Art. 9º LGPD */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-controller-section">1. Identificação do Controlador</h2>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">JusValida - Análise Jurídica por IA</h3>
                <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
                <p><strong>Endereço:</strong> Av. Paulista, 1000 - 10º andar, Bela Vista, São Paulo - SP, CEP 01310-100</p>
                <p><strong>E-mail:</strong> contato@jusvalida.com.br</p>
                <p><strong>Telefone:</strong> +55 (11) 3000-0000</p>
              </div>
            </section>

            <Separator />

            {/* Dados Pessoais Coletados */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-data-collection-section">2. Dados Pessoais Coletados</h2>
              <p className="mb-4">Coletamos os seguintes dados pessoais:</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">2.1 Dados de Identificação</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Nome completo</li>
                    <li>E-mail</li>
                    <li>Nome de usuário</li>
                    <li>Data e hora de cadastro</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium">2.2 Dados de Uso da Plataforma</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Documentos analisados (conteúdo e metadados)</li>
                    <li>Histórico de análises realizadas</li>
                    <li>Configurações de preferências</li>
                    <li>Logs de acesso e utilização</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium">2.3 Dados Técnicos</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Endereço IP</li>
                    <li>Informações do navegador e dispositivo</li>
                    <li>Cookies e tecnologias similares</li>
                    <li>Data e hora de acesso</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Finalidades do Tratamento */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-purposes-section">3. Finalidades do Tratamento</h2>
              <p className="mb-4">Seus dados são tratados para as seguintes finalidades:</p>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Prestação dos Serviços</h4>
                    <p className="text-muted-foreground">Análise de documentos jurídicos, geração de relatórios, histórico de análises</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Gestão da Conta</h4>
                    <p className="text-muted-foreground">Autenticação, controle de acesso, gerenciamento de créditos</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Comunicação</h4>
                    <p className="text-muted-foreground">Notificações de serviço, suporte técnico, atualizações importantes</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Melhoria dos Serviços</h4>
                    <p className="text-muted-foreground">Análise estatística, desenvolvimento de funcionalidades, otimização da plataforma</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Cumprimento de Obrigações Legais</h4>
                    <p className="text-muted-foreground">Atendimento a requisições judiciais, fiscais e regulamentares</p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Base Legal */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-legal-basis-section">4. Base Legal para o Tratamento</h2>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="mb-3">O tratamento dos seus dados pessoais é fundamentado nas seguintes bases legais da LGPD:</p>
                <ul className="space-y-2">
                  <li><strong>Art. 7º, I:</strong> Consentimento do titular (cadastro e uso voluntário)</li>
                  <li><strong>Art. 7º, V:</strong> Execução de contrato (prestação dos serviços)</li>
                  <li><strong>Art. 7º, VI:</strong> Cumprimento de obrigação legal ou regulatória</li>
                  <li><strong>Art. 7º, IX:</strong> Legítimo interesse (melhoria dos serviços)</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Direitos dos Titulares */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-rights-section">5. Seus Direitos (Art. 18º da LGPD)</h2>
              <p className="mb-4">Você tem os seguintes direitos sobre seus dados pessoais:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Confirmação e Acesso</h4>
                  <p className="text-sm text-muted-foreground">Confirmar a existência e acessar seus dados pessoais</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Correção</h4>
                  <p className="text-sm text-muted-foreground">Corrigir dados incompletos, inexatos ou desatualizados</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Eliminação</h4>
                  <p className="text-sm text-muted-foreground">Solicitar a exclusão de dados desnecessários ou excessivos</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Portabilidade</h4>
                  <p className="text-sm text-muted-foreground">Portabilidade dos dados para outro fornecedor</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Oposição</h4>
                  <p className="text-sm text-muted-foreground">Opor-se ao tratamento realizado com base no legítimo interesse</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Revogação</h4>
                  <p className="text-sm text-muted-foreground">Revogar o consentimento para tratamentos específicos</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Processadores de Dados */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-processors-section">6. Processadores de Dados e Transferências Internacionais</h2>
              <p className="mb-4">Para prestação dos nossos serviços, contamos com processadores de dados terceiros:</p>
              
              <div className="space-y-4">
                <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">🤖 Provedores de Inteligência Artificial</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                      <h4 className="font-medium">OpenAI Inc. (Estados Unidos)</h4>
                      <p className="text-muted-foreground mt-1">
                        <strong>Finalidade:</strong> Análise de documentos jurídicos via GPT-4 e modelos relacionados<br/>
                        <strong>Dados processados:</strong> Conteúdo dos documentos, metadados de análise<br/>
                        <strong>Base legal:</strong> Execução de contrato e legítimo interesse<br/>
                        <strong>Retenção:</strong> OpenAI não retém dados conforme política zero-retention<br/>
                        <strong>Garantias:</strong> Cláusulas contratuais padrão, certificação SOC 2
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                      <h4 className="font-medium">Anthropic PBC (Estados Unidos)</h4>
                      <p className="text-muted-foreground mt-1">
                        <strong>Finalidade:</strong> Análise de documentos jurídicos via Claude e modelos relacionados<br/>
                        <strong>Dados processados:</strong> Conteúdo dos documentos, metadados de análise<br/>
                        <strong>Base legal:</strong> Execução de contrato e legítimo interesse<br/>
                        <strong>Retenção:</strong> Dados não são utilizados para treinamento<br/>
                        <strong>Garantias:</strong> Cláusulas contratuais padrão, certificação SOC 2
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                      <h4 className="font-medium">Google LLC (Estados Unidos)</h4>
                      <p className="text-muted-foreground mt-1">
                        <strong>Finalidade:</strong> Análise de documentos jurídicos via Gemini<br/>
                        <strong>Dados processados:</strong> Conteúdo dos documentos, metadados de análise<br/>
                        <strong>Base legal:</strong> Execução de contrato e legítimo interesse<br/>
                        <strong>Retenção:</strong> Dados não são utilizados para treinamento<br/>
                        <strong>Garantias:</strong> Cláusulas contratuais padrão, adequação GDPR
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🏗️ Infraestrutura e Serviços</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                      <h4 className="font-medium">Replit Inc. (Estados Unidos)</h4>
                      <p className="text-muted-foreground mt-1">
                        <strong>Finalidade:</strong> Hospedagem da aplicação e banco de dados<br/>
                        <strong>Dados processados:</strong> Dados de usuários, documentos, análises<br/>
                        <strong>Base legal:</strong> Execução de contrato<br/>
                        <strong>Garantias:</strong> Certificação SOC 2, criptografia em trânsito e repouso
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                      <h4 className="font-medium">Stripe Inc. (Estados Unidos)</h4>
                      <p className="text-muted-foreground mt-1">
                        <strong>Finalidade:</strong> Processamento de pagamentos<br/>
                        <strong>Dados processados:</strong> Dados de pagamento, transações<br/>
                        <strong>Base legal:</strong> Execução de contrato<br/>
                        <strong>Garantias:</strong> Certificação PCI DSS Level 1, adequação GDPR
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg mt-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="text-amber-600 mt-1" size={20} />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Transferências Internacionais</p>
                    <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                      Alguns processadores estão localizados fora do Brasil. Todas as transferências são 
                      realizadas com base em cláusulas contratuais padrão aprovadas pela ANPD e garantias 
                      adequadas de proteção conforme Art. 33 da LGPD.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Segurança */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-security-section">7. Segurança dos Dados</h2>
              <p className="mb-4">Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados:</p>
              
              <ul className="space-y-2 text-muted-foreground">
                <li>• Criptografia de dados em trânsito e em repouso</li>
                <li>• Controles de acesso baseados em função</li>
                <li>• Monitoramento e auditoria contínua</li>
                <li>• Backup e recuperação de dados</li>
                <li>• Treinamento regular da equipe</li>
              </ul>
            </section>

            <Separator />

            {/* Retenção */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-retention-section">8. Retenção de Dados</h2>
              <div className="space-y-3">
                <p><strong>Dados de conta:</strong> Mantidos enquanto a conta estiver ativa ou conforme necessário para prestação dos serviços</p>
                <p><strong>Documentos analisados:</strong> Armazenados por até 2 anos após a última análise, salvo solicitação de exclusão</p>
                <p><strong>Logs de acesso:</strong> Mantidos por 6 meses para fins de segurança</p>
                <p><strong>Dados para cumprimento legal:</strong> Conforme prazo estabelecido pela legislação aplicável</p>
              </div>
            </section>

            <Separator />

            {/* Contato */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-contact-section">9. Contato e Exercício de Direitos</h2>
              
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="font-medium mb-4">Encarregado de Proteção de Dados (DPO)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <p className="text-muted-foreground">dpo@jusvalida.com.br</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Telefone</p>
                      <p className="text-muted-foreground">+55 (11) 3000-0001</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-sm">
                    <strong>Prazo de resposta:</strong> Até 15 dias úteis conforme Art. 19º da LGPD
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Alterações */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-changes-section">10. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas 
                por e-mail e através de aviso na plataforma. O uso continuado dos serviços após as alterações 
                constitui aceitação da nova política.
              </p>
            </section>

            <Separator />

            {/* ANPD */}
            <section>
              <h2 className="text-xl font-semibold mb-3" data-testid="text-anpd-section">11. Autoridade Nacional de Proteção de Dados</h2>
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <p className="mb-2">
                  Em caso de descumprimento desta política, você pode registrar reclamação na ANPD:
                </p>
                <p><strong>Website:</strong> www.gov.br/anpd</p>
                <p><strong>E-mail:</strong> faleconosco@anpd.gov.br</p>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}