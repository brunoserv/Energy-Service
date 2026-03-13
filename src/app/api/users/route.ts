import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createUserSchema } from "@/lib/validations";
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

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { password, ...rest } = result.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { ...rest, password: hashedPassword },
    select: userSelect,
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
