/**
 * Notification Service — Energy Service
 *
 * Responsável por persistir logs de notificações no banco de dados.
 * Chamado pelo EventDispatcher após cada evento.
 */

import { db } from "@/lib/db";
import type { AppEvent } from "@/types";
import type { NotificationType } from "@prisma/client";

class NotificationService {
  /** Persiste um evento como log de notificação no banco */
  async logEvent(event: AppEvent): Promise<void> {
    const type = this.mapEventToType(event.type);
    if (!type) return;

    const enriched = event as AppEvent & {
      clientPhone?: string;
      clientName?: string;
    };

    await db.notification.create({
      data: {
        projectId: event.projectId ?? null,
        type,
        channel: "system",
        recipient: enriched.clientPhone ?? "system",
        message: this.buildMessage(event),
        sentAt: new Date(),
        success: true,
      },
    });
  }

  /** Persiste log de mensagem WhatsApp enviada */
  async logWhatsApp(params: {
    projectId?: string;
    type: NotificationType;
    recipient: string;
    message: string;
    success: boolean;
    errorMsg?: string;
  }): Promise<void> {
    await db.notification.create({
      data: {
        projectId: params.projectId ?? null,
        type: params.type,
        channel: "whatsapp",
        recipient: params.recipient,
        message: params.message,
        sentAt: new Date(),
        success: params.success,
        errorMsg: params.errorMsg ?? null,
      },
    });
  }

  private mapEventToType(eventType: string): NotificationType | null {
    const map: Record<string, NotificationType> = {
      status_changed: "STATUS_CHANGED",
      document_uploaded: "DOCUMENT_UPLOADED",
      task_created: "TASK_CREATED",
      homologation_completed: "HOMOLOGATION_COMPLETED",
    };
    return map[eventType] ?? null;
  }

  private buildMessage(event: AppEvent): string {
    switch (event.type) {
      case "status_changed":
        return `Status ${event.category} alterado para ${event.newValue}`;
      case "document_uploaded":
        return `Documento "${event.documentName}" enviado ao projeto`;
      case "task_created":
        return `Tarefa criada: ${event.title}`;
      case "homologation_completed":
        return `Projeto homologado com sucesso`;
      default:
        return `Evento: ${event.type}`;
    }
  }
}

export const notificationService = new NotificationService();
