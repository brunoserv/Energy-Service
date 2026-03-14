export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { documentMetaSchema } from "@/lib/validations";
import { uploadDocument } from "@/lib/supabase";
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

  const documents = await db.document.findMany({
    where: { projectId: params.id },
    include: { uploadedBy: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: documents });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const visibleToClient = formData.get("visibleToClient") === "true";

  if (!file) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  const metaResult = documentMetaSchema.safeParse({ name, type, visibleToClient });
  if (!metaResult.success) {
    return NextResponse.json(
      { error: metaResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await db.project.findUnique({
    where: { id: params.id, active: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileUrl, fileKey } = await uploadDocument(
    buffer,
    file.name,
    params.id,
    file.type
  );

  const document = await db.document.create({
    data: {
      projectId: params.id,
      name: metaResult.data.name,
      type: metaResult.data.type,
      visibleToClient: metaResult.data.visibleToClient,
      fileUrl,
      fileKey,
      mimeType: file.type,
      size: file.size,
      uploadedById: session.user.id,
    },
  });

  await dispatchEvent({
    type: "document_uploaded",
    timestamp: new Date().toISOString(),
    projectId: params.id,
    documentId: document.id,
    documentName: document.name,
    visibleToClient: document.visibleToClient,
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
