/**
 * Event Dispatcher — Energy Service
 *
 * Responsável por disparar eventos do sistema para integrações externas:
 * - WhatsApp Cloud API (notificações ao cliente)
 * - n8n (automações e workflows)
 * - Logs internos
 *
 * Todos os pontos de integração são desacoplados.
 * Para adicionar um novo canal: implemente um handler e registre-o abaixo.
 */

import type { AppEvent } from "@/types";
import { whatsappService } from "./whatsapp.service";
import { notificationService } from "./notification.service";

type EventHandler = (event: AppEvent) => Promise<void>;

const handlers: EventHandler[] = [
  // Handler: WhatsApp
  async (event) => {
    await whatsappService.handleEvent(event);
  },

  // Handler: n8n Webhook (automações externas)
  async (event) => {
    await dispatchToN8n(event);
  },

  // Handler: Log interno de notificações
  async (event) => {
    await notificationService.logEvent(event);
  },
];

/**
 * Dispara um evento para todos os handlers registrados.
 * Erros em handlers individuais são capturados e logados sem interromper os outros.
 */
export async function dispatchEvent(event: AppEvent): Promise<void> {
  const results = await Promise.allSettled(
    handlers.map((handler) => handler(event))
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `[EventDispatcher] Handler ${index} falhou para evento "${event.type}":`,
        result.reason
      );
    }
  });
}

/**
 * Envia o evento para o webhook do n8n.
 * Configurado via variável de ambiente N8N_WEBHOOK_URL.
 */
async function dispatchToN8n(event: AppEvent): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    // n8n não configurado — ignorar silenciosamente
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(
      `n8n webhook retornou status ${response.status}: ${await response.text()}`
    );
  }
}
