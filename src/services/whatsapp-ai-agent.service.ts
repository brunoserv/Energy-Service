/**
 * Agente de IA para respostas automáticas via WhatsApp
 *
 * Usa Claude (Anthropic) para responder mensagens recebidas dos clientes.
 * O agente tem contexto sobre a empresa e pode responder dúvidas comuns
 * sobre projetos de energia solar.
 */

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Você é um assistente virtual da Energy Service, empresa especializada em instalação e homologação de sistemas de energia solar.

Seu papel é atender clientes via WhatsApp de forma cordial, clara e objetiva.

Você pode ajudar com:
- Informações sobre o andamento do projeto (venda, pedido, instalação, homologação)
- Dúvidas sobre energia solar (como funciona, economia, prazo de retorno)
- Documentos necessários para homologação junto à concessionária
- Agendamentos e visitas técnicas
- Esclarecimentos sobre a fatura de energia após instalação

Diretrizes:
- Responda sempre em português brasileiro
- Seja cordial e use linguagem acessível, não técnica demais
- Se não souber algo específico sobre o projeto do cliente, diga que vai verificar e que um atendente entrará em contato
- Nunca invente informações sobre status de projeto ou prazos específicos sem ter dados reais
- Mensagens curtas e diretas — WhatsApp não é e-mail
- Use emojis com moderação para deixar a conversa mais amigável`;

export interface WhatsAppIncomingMessage {
  from: string; // número do remetente
  text: string; // texto da mensagem
  messageId: string;
}

class WhatsAppAIAgentService {
  private client: Anthropic | null = null;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = !!process.env.ANTHROPIC_API_KEY;
    if (this.enabled) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /** Gera uma resposta automática para a mensagem do cliente */
  async generateReply(message: WhatsAppIncomingMessage): Promise<string | null> {
    if (!this.enabled || !this.client) {
      console.log(
        `[WhatsApp AI] (desativado — configure ANTHROPIC_API_KEY)\nMensagem de ${message.from}: ${message.text}`
      );
      return null;
    }

    const response = await this.client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message.text,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.type === "text" ? textBlock.text : null;
  }
}

export const whatsappAIAgent = new WhatsAppAIAgentService();
