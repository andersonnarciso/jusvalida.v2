import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { decryptApiKey } from '../lib/encryption';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private lastConfigUpdate: Date | null = null;

  async getTransporter(): Promise<nodemailer.Transporter> {
    // Check if we need to refresh the transporter (every 5 minutes)
    const shouldRefresh = !this.transporter || 
      !this.lastConfigUpdate || 
      (Date.now() - this.lastConfigUpdate.getTime() > 5 * 60 * 1000);

    if (shouldRefresh) {
      const config = await storage.getSmtpConfig();
      
      if (!config) {
        throw new Error('Configuração SMTP não encontrada. Configure o SMTP no painel administrativo.');
      }

      // Decrypt password
      const decryptedPassword = await decryptApiKey(config.password);

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure, // true for 465, false for other ports
        auth: {
          user: config.username,
          pass: decryptedPassword,
        },
      });

      this.lastConfigUpdate = new Date();
    }

    return this.transporter!;
  }

  async sendContactEmail(params: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
    phone?: string;
  }) {
    const { name, email, company, subject, message, phone } = params;
    
    const transporter = await this.getTransporter();
    const config = await storage.getSmtpConfig();
    
    if (!config) {
      throw new Error('Configuração SMTP não disponível');
    }

    const subjectLabels: Record<string, string> = {
      general: "Informações Gerais",
      support: "Suporte Técnico",
      sales: "Vendas e Preços",
      partnership: "Parcerias",
      legal: "Questões Legais",
      press: "Imprensa",
    };

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">Nova Mensagem de Contato - JusValida</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Informações do Remetente</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            ${company ? `<p><strong>Empresa:</strong> ${company}</p>` : ''}
            ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
            <p><strong>Assunto:</strong> ${subjectLabels[subject] || subject}</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Mensagem</h3>
            <div style="white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>Esta mensagem foi enviada através do formulário de contato do JusValida.</p>
            <p>Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Nova Mensagem de Contato - JusValida

INFORMAÇÕES DO REMETENTE:
Nome: ${name}
E-mail: ${email}
${company ? `Empresa: ${company}` : ''}
${phone ? `Telefone: ${phone}` : ''}
Assunto: ${subjectLabels[subject] || subject}

MENSAGEM:
${message}

---
Esta mensagem foi enviada através do formulário de contato do JusValida.
Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
    `;

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: config.fromEmail, // Send to the same email configured
      replyTo: email, // Allow replying directly to the contact
      subject: `[JusValida] ${subjectLabels[subject] || 'Contato'} - ${name}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Contact email sent:', {
      messageId: info.messageId,
      from: email,
      subject: subjectLabels[subject] || subject,
      timestamp: new Date().toISOString()
    });

    return info;
  }

  async sendTestEmail(testEmail: string) {
    const transporter = await this.getTransporter();
    const config = await storage.getSmtpConfig();
    
    if (!config) {
      throw new Error('Configuração SMTP não disponível');
    }

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: testEmail,
      subject: '[JusValida] Teste de Configuração SMTP',
      text: `Este é um e-mail de teste para verificar a configuração SMTP do JusValida.\n\nSe você recebeu esta mensagem, a configuração está funcionando corretamente!\n\nData/Hora do teste: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb;">Teste de Configuração SMTP - JusValida</h2>
            <p>Este é um e-mail de teste para verificar a configuração SMTP do JusValida.</p>
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="margin: 0; color: #15803d;"><strong>✅ Configuração funcionando corretamente!</strong></p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
              Data/Hora do teste: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test email sent:', {
      messageId: info.messageId,
      to: testEmail,
      timestamp: new Date().toISOString()
    });

    return info;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();