import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validations";

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

  const task = await db.task.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: userSelect },
      createdBy: { select: userSelect },
    },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Tarefa não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: task });
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
  const result = taskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const task = await db.task.update({
    where: { id: params.id },
    data: {
      ...result.data,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
    },
  });

  return NextResponse.json({ data: task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await db.task.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Tarefa removida" });
}
