import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validations";
import { dispatchEvent } from "@/services/event-dispatcher";

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

  const tasks = await db.task.findMany({
    where: { projectId: params.id },
    include: {
      assignedTo: { select: userSelect },
      createdBy: { select: userSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = taskSchema.safeParse({ ...body, projectId: params.id });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const task = await db.task.create({
    data: {
      ...result.data,
      projectId: params.id,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      createdById: session.user.id,
    },
  });

  await dispatchEvent({
    type: "task_created",
    timestamp: new Date().toISOString(),
    projectId: params.id,
    taskId: task.id,
    title: task.title,
    assignedToId: task.assignedToId ?? undefined,
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
