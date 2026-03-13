import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const client = await db.client.findUnique({
    where: { id: params.id, active: true },
    include: {
      projects: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Cliente não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: client });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = clientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const client = await db.client.update({
    where: { id: params.id },
    data: { ...result.data, email: result.data.email || null },
  });

  return NextResponse.json({ data: client });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await db.client.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json({ message: "Cliente removido" });
}
