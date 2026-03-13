/**
 * WhatsApp Cloud API Service — Energy Service
 *
 * Integração com a API oficial do WhatsApp (Meta).
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Para ativar: configure as variáveis de ambiente:
 *   WHATSAPP_API_URL
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_ACCESS_TOKEN
 */

import type {
  AppEvent,
  StatusChangedEvent,
  HomologationCompletedEvent,
} from "@/types";
import {
  SALE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  SYSTEM_STATUS_LABELS,
} from "@/types";
import type { StatusCategory } from "@prisma/client";

interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { body: string };
}

class WhatsAppService {
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly enabled: boolean;

  constructor() {
    this.apiUrl =
      process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v18.0";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
    this.enabled = !!(this.phoneNumberId && this.accessToken);
  }

  /** Envia uma mensagem de texto simples */
  async sendText(to: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log(
        `[WhatsApp] (desativado) Para: ${to}\nMensagem: ${message}`
      );
      return false;
    }

    const phone = this.normalizePhone(to);
    const body: WhatsAppTextMessage = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    };

    const response = await fetch(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return true;
  }

  /** Roteador de eventos — decide qual mensagem enviar */
  async handleEvent(event: AppEvent): Promise<void> {
    switch (event.type) {
      case "status_changed":
        await this.onStatusChanged(event);
        break;
      case "homologation_completed":
        await this.onHomologationCompleted(event);
        break;
      // document_uploaded e task_created não geram mensagem WA por padrão
      default:
        break;
    }
  }

  private async onStatusChanged(event: StatusChangedEvent): Promise<void> {
    // Para enviar WA, precisamos do telefone do cliente.
    // O dispatcher deve enriquecer o evento com clientPhone quando disponível.
    const phone = (event as StatusChangedEvent & { clientPhone?: string })
      .clientPhone;

    if (!phone) return;

    const label = this.getStatusLabel(event.category, event.newValue);
    const categoryLabel = this.getCategoryLabel(event.category);
    const message =
      `🌟 *Energy Service* — Atualização do seu projeto!\n\n` +
      `📋 ${categoryLabel}: *${label}*\n` +
      (event.notes ? `📝 ${event.notes}\n` : "") +
      `\nDúvidas? Responda esta mensagem.`;

    await this.sendText(phone, message);
  }

  private async onHomologationCompleted(
    event: HomologationCompletedEvent
  ): Promise<void> {
    if (!event.clientPhone) return;

    const message =
      `🎉 *Parabéns, ${event.clientName ?? "cliente"}!*\n\n` +
      `Seu sistema de energia solar foi *homologado* com sucesso! ✅\n\n` +
      `A partir de agora você já pode aproveitar sua energia limpa e economizar na conta de luz.\n\n` +
      `Obrigado por confiar na *Energy Service*! ☀️`;

    await this.sendText(event.clientPhone, message);
  }

  private getStatusLabel(category: StatusCategory, value: string): string {
    switch (category) {
      case "SALE":
        return (
          SALE_STATUS_LABELS[value as keyof typeof SALE_STATUS_LABELS] ?? value
        );
      case "ORDER":
        return (
          ORDER_STATUS_LABELS[value as keyof typeof ORDER_STATUS_LABELS] ??
          value
        );
      case "PROJECT":
        return (
          PROJECT_STATUS_LABELS[
            value as keyof typeof PROJECT_STATUS_LABELS
          ] ?? value
        );
      case "SYSTEM":
        return (
          SYSTEM_STATUS_LABELS[
            value as keyof typeof SYSTEM_STATUS_LABELS
          ] ?? value
        );
    }
  }

  private getCategoryLabel(category: StatusCategory): string {
    const labels: Record<StatusCategory, string> = {
      SALE: "Status da Venda",
      ORDER: "Status do Pedido",
      PROJECT: "Status do Projeto",
      SYSTEM: "Status do Sistema",
    };
    return labels[category];
  }

  /** Normaliza número para formato internacional (+55...) */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) return digits;
    return `55${digits}`;
  }
}

export const whatsappService = new WhatsAppService();
