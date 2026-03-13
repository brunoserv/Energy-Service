import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "20");
  const skip = (page - 1) * perPage;

  const where = projectId ? { projectId } : {};

  const [data, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.notification.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}
