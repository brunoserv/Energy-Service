import { NextResponse } from "next/server";
import { whatsappService } from "@/services/whatsapp.service";
import { whatsappAIAgent } from "@/services/whatsapp-ai-agent.service";

// Verificação do webhook pelo Meta (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 });
}

// Recebimento de eventos do WhatsApp (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Resposta imediata exigida pelo Meta (< 20s)
    // Processar em background para não bloquear
    processIncomingMessages(body).catch((err) => {
      console.error("[WhatsApp Webhook] Erro ao processar mensagens:", err);
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
}

/** Extrai e processa mensagens de texto recebidas */
async function processIncomingMessages(payload: unknown): Promise<void> {
  const p = payload as Record<string, unknown>;

  const entries = p?.entry as Array<Record<string, unknown>> | undefined;
  if (!entries) return;

  for (const entry of entries) {
    const changes = entry?.changes as Array<Record<string, unknown>> | undefined;
    if (!changes) continue;

    for (const change of changes) {
      const value = change?.value as Record<string, unknown> | undefined;
      const messages = value?.messages as Array<Record<string, unknown>> | undefined;
      if (!messages) continue;

      for (const msg of messages) {
        // Só processa mensagens de texto
        if (msg.type !== "text") continue;

        const from = msg.from as string;
        const messageId = msg.id as string;
        const text = (msg.text as Record<string, string>)?.body;

        if (!from || !text) continue;

        console.log(`[WhatsApp Webhook] Mensagem de ${from}: ${text}`);

        try {
          const reply = await whatsappAIAgent.generateReply({
            from,
            text,
            messageId,
          });

          if (reply) {
            await whatsappService.sendText(from, reply);
            console.log(`[WhatsApp Webhook] Resposta enviada para ${from}`);
          }
        } catch (err) {
          console.error(
            `[WhatsApp Webhook] Falha ao gerar/enviar resposta para ${from}:`,
            err
          );
        }
      }
    }
  }
}
