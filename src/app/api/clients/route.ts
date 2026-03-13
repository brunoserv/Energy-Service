import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "20");
  const skip = (page - 1) * perPage;

  const where = search
    ? {
        active: true,
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { active: true };

  const [data, total] = await Promise.all([
    db.client.findMany({
      where,
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.client.count({ where }),
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
  const result = clientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const client = await db.client.create({
    data: {
      ...result.data,
      email: result.data.email || null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ data: client }, { status: 201 });
}
