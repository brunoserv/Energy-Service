import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validations";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const project = await db.project.findUnique({
    where: { id: params.id, active: true },
    include: {
      client: true,
      statusHistory: {
        include: { changedBy: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        include: { uploadedBy: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          assignedTo: { select: userSelect },
          createdBy: { select: userSelect },
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: { select: userSelect },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: project });
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
  const result = projectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await db.project.update({
    where: { id: params.id },
    data: result.data,
  });

  return NextResponse.json({ data: project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await db.project.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json({ message: "Projeto removido" });
}
