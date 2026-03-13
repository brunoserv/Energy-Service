import { NextResponse } from "next/server";

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
    // Processamento assíncrono de eventos pode ser adicionado aqui via queue
    console.log("[WhatsApp Webhook]", JSON.stringify(body, null, 2));
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
}
