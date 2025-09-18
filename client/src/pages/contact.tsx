import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Building,
  Users,
  Shield,
  MessageSquare
} from 'lucide-react';

// Contact form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  company: z.string().optional(),
  subject: z.enum([
    "general",
    "support",
    "sales", 
    "partnership",
    "legal",
    "press"
  ], {
    required_error: "Por favor selecione um assunto",
  }),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  phone: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const subjectOptions = [
  { value: "general", label: "Informações Gerais" },
  { value: "support", label: "Suporte Técnico" },
  { value: "sales", label: "Vendas e Preços" },
  { value: "partnership", label: "Parcerias" },
  { value: "legal", label: "Questões Legais" },
  { value: "press", label: "Imprensa" },
];

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: undefined,
      message: "",
      phone: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Mensagem Enviada",
        description: "Sua mensagem foi enviada com sucesso. Entraremos em contato em breve.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 pt-16 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Entre em Contato
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa equipe está pronta para ajudar você com suas necessidades de análise jurídica. 
              Entre em contato conosco através dos canais abaixo.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Contact Cards */}
            <Card data-testid="card-contact-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="text-primary" size={20} />
                  <span>Informações da Empresa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="text-muted-foreground mt-1" size={16} />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">
                      Av. Paulista, 1000 - 10º andar<br />
                      Bela Vista, São Paulo - SP<br />
                      CEP 01310-100
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="text-muted-foreground" size={16} />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <a 
                      href="tel:+5511300000000" 
                      className="text-sm text-primary hover:underline"
                      data-testid="link-phone"
                    >
                      +55 (11) 3000-0000
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="text-muted-foreground" size={16} />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <a 
                      href="mailto:contato@jusvalida.com.br" 
                      className="text-sm text-primary hover:underline"
                      data-testid="link-email"
                    >
                      contato@jusvalida.com.br
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="text-muted-foreground mt-1" size={16} />
                  <div>
                    <p className="font-medium">Horário de Atendimento</p>
                    <p className="text-sm text-muted-foreground">
                      Segunda a Sexta: 9h às 18h<br />
                      Sábado: 9h às 13h<br />
                      Domingo: Fechado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Options */}
            <Card data-testid="card-support-options">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="text-primary" size={20} />
                  <span>Canais de Suporte</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="text-primary" size={16} />
                    <span className="font-medium">Suporte Técnico</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Para questões técnicas e problemas com a plataforma
                  </p>
                  <a 
                    href="mailto:suporte@jusvalida.com.br" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-support-email"
                  >
                    suporte@jusvalida.com.br
                  </a>
                </div>
                
                <div className="p-4 bg-accent/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="text-accent" size={16} />
                    <span className="font-medium">LGPD e Privacidade</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Questões sobre proteção de dados e privacidade
                  </p>
                  <a 
                    href="mailto:dpo@jusvalida.com.br" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-privacy-email"
                  >
                    dpo@jusvalida.com.br
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card data-testid="card-contact-form">
              <CardHeader>
                <CardTitle>Envie sua Mensagem</CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo e nossa equipe entrará em contato com você em até 24 horas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Seu nome completo" 
                                data-testid="input-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="seu@email.com" 
                                data-testid="input-email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa (Opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome da empresa" 
                                data-testid="input-company"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone (Opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(11) 99999-9999" 
                                data-testid="input-phone"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assunto *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subject">
                                <SelectValue placeholder="Selecione o assunto da sua mensagem" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjectOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Escreva sua mensagem aqui. Seja específico sobre o que precisa de ajuda."
                              className="min-h-[120px]"
                              data-testid="input-message"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={contactMutation.isPending}
                      data-testid="button-send-message"
                    >
                      {contactMutation.isPending ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="mr-2" size={16} />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}