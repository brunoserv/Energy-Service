import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStatusSchema } from "@/lib/validations";
import { dispatchEvent } from "@/services/event-dispatcher";

const STATUS_FIELD_MAP = {
  SALE: "saleStatus",
  ORDER: "orderStatus",
  PROJECT: "projectStatus",
  SYSTEM: "systemStatus",
} as const;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = updateStatusSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { category, newValue, notes } = result.data;
  const field = STATUS_FIELD_MAP[category];

  const project = await db.project.findUnique({
    where: { id: params.id, active: true },
    include: { client: { select: { phone: true, name: true } } },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 }
    );
  }

  const previousValue = project[field] as string;

  const updated = await db.project.update({
    where: { id: params.id },
    data: { [field]: newValue },
  });

  await db.projectStatusHistory.create({
    data: {
      projectId: params.id,
      category,
      previousValue,
      newValue,
      changedById: session.user.id,
      notes,
    },
  });

  const isHomologation = category === "SYSTEM" && newValue === "HOMOLOGATED";

  if (isHomologation) {
    await dispatchEvent({
      type: "homologation_completed",
      timestamp: new Date().toISOString(),
      projectId: params.id,
      clientId: project.clientId,
      clientPhone: project.client.phone ?? undefined,
      clientName: project.client.name,
    });
  } else {
    await dispatchEvent({
      type: "status_changed",
      timestamp: new Date().toISOString(),
      projectId: params.id,
      clientId: project.clientId,
      category,
      previousValue,
      newValue,
      changedById: session.user.id,
      notes,
    });
  }

  return NextResponse.json({ data: updated });
}
