import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const client = await db.client.findUnique({
    where: { portalToken: params.token, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      projects: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          saleStatus: true,
          orderStatus: true,
          projectStatus: true,
          systemStatus: true,
          power: true,
          inverterModel: true,
          panelModel: true,
          panelCount: true,
          installationAddress: true,
          installationCity: true,
          createdAt: true,
          updatedAt: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              category: true,
              previousValue: true,
              newValue: true,
              notes: true,
              createdAt: true,
            },
          },
          documents: {
            where: { visibleToClient: true },
            select: {
              id: true,
              name: true,
              type: true,
              fileUrl: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Portal não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: client });
}
