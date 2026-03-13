import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "OPERATOR", "CLIENT"]).optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: userSelect,
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: user });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const result = updateUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { password, ...rest } = result.data;
  const data: Record<string, unknown> = { ...rest };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await db.user.update({
    where: { id: params.id },
    data,
    select: userSelect,
  });

  return NextResponse.json({ data: user });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode remover seu próprio usuário" },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json({ message: "Usuário desativado" });
}
