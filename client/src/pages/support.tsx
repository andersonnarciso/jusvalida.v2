import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, HelpCircle, Send, Eye } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  userId?: string;
  message: string;
  isFromSupport: boolean;
  createdAt: string;
}

interface TicketDetails {
  ticket: SupportTicket;
  messages: TicketMessage[];
}

export default function Support() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [newMessage, setNewMessage] = useState('');

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/support/tickets');
      return response.json();
    }
  });

  const { data: ticketDetails, isLoading: detailsLoading } = useQuery<TicketDetails>({
    queryKey: ['/api/support/tickets', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const response = await apiRequest('GET', `/api/support/tickets/${selectedTicketId}`);
      return response.json();
    },
    enabled: !!selectedTicketId
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/support/tickets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Criado",
        description: "Seu ticket de suporte foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setIsCreateDialogOpen(false);
      setNewTicket({ subject: '', message: '', priority: 'normal' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ticket",
        variant: "destructive",
      });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const response = await apiRequest('POST', `/api/support/tickets/${ticketId}/messages`, { message, isFromSupport: false });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensagem Enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', selectedTicketId] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o assunto e a mensagem",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  const handleSendMessage = () => {
    if (!selectedTicketId || !newMessage.trim()) return;
    sendMessageMutation.mutate({ ticketId: selectedTicketId, message: newMessage });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="text-blue-600" size={16} />;
      case 'pending': return <Clock className="text-yellow-600" size={16} />;
      case 'resolved': return <CheckCircle className="text-green-600" size={16} />;
      case 'closed': return <CheckCircle className="text-gray-600" size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'pending': return 'Pendente';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'normal': return 'Normal';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-support-title">
                Suporte
              </h1>
              <p className="text-muted-foreground" data-testid="text-support-description">
                Obtenha ajuda e suporte técnico para o JusValida
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-ticket">
                  <Plus className="mr-2" size={16} />
                  Novo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="dialog-create-ticket">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket</DialogTitle>
                  <DialogDescription>
                    Descreva seu problema ou dúvida em detalhes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      placeholder="Descreva brevemente o problema"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      data-testid="input-ticket-subject"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva seu problema em detalhes..."
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="min-h-32"
                      data-testid="textarea-ticket-message"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-ticket">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateTicket} 
                      disabled={createTicketMutation.isPending}
                      data-testid="button-submit-ticket"
                    >
                      {createTicketMutation.isPending ? "Criando..." : "Criar Ticket"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" data-testid="text-tickets-title">
                  <MessageSquare className="mr-2" size={20} />
                  Meus Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border border-border rounded-lg">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-tickets">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum ticket encontrado</p>
                    <p className="text-sm">Crie seu primeiro ticket de suporte</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/5 ${
                          selectedTicketId === ticket.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        data-testid={`card-ticket-${ticket.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2" data-testid={`text-ticket-subject-${ticket.id}`}>
                            {ticket.subject}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            {getStatusIcon(ticket.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground" data-testid={`text-ticket-date-${ticket.id}`}>
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2">
            {selectedTicketId ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid="text-ticket-details-subject">
                        {ticketDetails?.ticket.subject}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span>Criado em {ticketDetails?.ticket.createdAt && formatDate(ticketDetails.ticket.createdAt)}</span>
                        <Badge className={`${getStatusColor(ticketDetails?.ticket.status || '')}`}>
                          {getStatusLabel(ticketDetails?.ticket.status || '')}
                        </Badge>
                        <Badge className={`${getPriorityColor(ticketDetails?.ticket.priority || '')}`}>
                          {getPriorityLabel(ticketDetails?.ticket.priority || '')}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {detailsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 bg-muted/20 rounded-lg">
                          <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                          <div className="h-4 bg-muted rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Messages */}
                      <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="messages-container">
                        {ticketDetails?.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg ${
                              message.isFromSupport
                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                : 'bg-gray-50 border-l-4 border-gray-300'
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {message.isFromSupport ? '🎧 Suporte JusValida' : '👤 Você'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap" data-testid={`text-message-content-${message.id}`}>
                              {message.message}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      {ticketDetails?.ticket.status !== 'closed' && (
                        <div className="border-t pt-4">
                          <Label htmlFor="reply">Sua Resposta</Label>
                          <div className="flex space-x-2 mt-2">
                            <Textarea
                              id="reply"
                              placeholder="Digite sua mensagem..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="flex-1"
                              data-testid="textarea-reply"
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={sendMessageMutation.isPending || !newMessage.trim()}
                              className="self-end"
                              data-testid="button-send-message"
                            >
                              {sendMessageMutation.isPending ? (
                                "Enviando..."
                              ) : (
                                <>
                                  <Send size={16} />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center text-muted-foreground" data-testid="text-select-ticket">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Selecione um ticket para ver os detalhes</p>
                    <p className="text-sm">Ou crie um novo ticket de suporte</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center" data-testid="text-help-title">
              <HelpCircle className="mr-2" size={20} />
              Perguntas Frequentes
            </CardTitle>
            <CardDescription>
              Encontre respostas rápidas para dúvidas comuns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Como funciona o sistema de créditos?</h4>
                  <p className="text-sm text-muted-foreground">
                    Cada análise consome créditos baseado no provedor de IA escolhido. OpenAI GPT-5 usa 3 créditos, 
                    Claude 3 créditos, Gemini 1 crédito, e IA gratuita não consome créditos.
                  </p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Posso usar minha própria API key?</h4>
                  <p className="text-sm text-muted-foreground">
                    Sim! Configure suas chaves de API na página de Perfil para usar seus próprios créditos 
                    diretamente com os provedores de IA, economizando nos custos.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Quais tipos de documento posso analisar?</h4>
                  <p className="text-sm text-muted-foreground">
                    Suportamos PDF, DOC, DOCX e texto direto. Você pode analisar contratos, petições, 
                    acordos, e outros documentos jurídicos.
                  </p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Como funciona o plano gratuito?</h4>
                  <p className="text-sm text-muted-foreground">
                    O plano gratuito inclui 5 créditos iniciais e permite 2 análises diárias usando 
                    nossa IA gratuita, com limite de 5 páginas por documento.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
