import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validations";
import { dispatchEvent } from "@/services/event-dispatcher";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const clientId = searchParams.get("clientId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "20");
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { active: true };
  if (clientId) where.clientId = clientId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            portalToken: true,
          },
        },
        _count: { select: { documents: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.project.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = projectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await db.project.create({
    data: { ...result.data, createdById: session.user.id },
    include: {
      client: { select: { id: true, name: true, phone: true } },
    },
  });

  await db.projectStatusHistory.create({
    data: {
      projectId: project.id,
      category: "SALE",
      previousValue: null,
      newValue: "CONFIRMED",
      changedById: session.user.id,
      notes: "Projeto criado",
    },
  });

  await dispatchEvent({
    type: "project_created",
    timestamp: new Date().toISOString(),
    projectId: project.id,
    clientId: project.clientId,
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
