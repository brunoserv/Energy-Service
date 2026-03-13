import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".txt": "text/plain",
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const uploadsBase = path.resolve(process.cwd(), "uploads");
  const filePath = path.resolve(uploadsBase, ...params.path);

  // Previne path traversal
  if (!filePath.startsWith(uploadsBase + path.sep) && filePath !== uploadsBase) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const file = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(file, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
