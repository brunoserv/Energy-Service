import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const client = await db.client.update({
    where: { id: params.id },
    data: { portalToken: randomUUID() },
    select: { id: true, portalToken: true },
  });

  return NextResponse.json({ data: client });
}
