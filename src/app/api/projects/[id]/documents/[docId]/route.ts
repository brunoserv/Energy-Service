export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteDocument } from "@/lib/supabase";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const document = await db.document.findUnique({
    where: { id: params.docId, projectId: params.id },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Documento não encontrado" },
      { status: 404 }
    );
  }

  await deleteDocument(document.fileKey);
  await db.document.delete({ where: { id: params.docId } });

  return NextResponse.json({ message: "Documento removido" });
}
