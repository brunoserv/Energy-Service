import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

// Client público (browser) — inicializado de forma lazy para evitar erro no build
let _supabase: ReturnType<typeof createClient> | null = null;
export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// Client admin (server-side, usa service role key — NÃO expor ao browser)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// Bucket para documentos de projetos
export const DOCUMENTS_BUCKET = "project-documents";

/**
 * Retorna true se o Supabase Storage está configurado com credenciais reais.
 * Quando não configurado, o sistema usa armazenamento local (pasta /uploads).
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.includes("supabase.co");
}

/**
 * Faz upload de um arquivo para o Supabase Storage ou para o disco local.
 * Retorna a URL pública e o fileKey (caminho no bucket/disco).
 */
export async function uploadDocument(
  file: File | Buffer,
  fileName: string,
  projectId: string,
  mimeType?: string
): Promise<{ fileUrl: string; fileKey: string }> {
  if (!isSupabaseConfigured()) {
    return uploadDocumentLocal(file, fileName, projectId);
  }

  const admin = getSupabaseAdmin();
  const fileKey = `projects/${projectId}/${Date.now()}-${fileName}`;

  const { error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(fileKey, file, {
      contentType: mimeType ?? "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }

  const { data } = admin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(fileKey);

  return {
    fileUrl: data.publicUrl,
    fileKey,
  };
}

/**
 * Upload local: salva o arquivo em /uploads dentro do diretório de trabalho.
 */
async function uploadDocumentLocal(
  file: File | Buffer,
  fileName: string,
  projectId: string
): Promise<{ fileUrl: string; fileKey: string }> {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `projects/${projectId}/${Date.now()}-${safeFileName}`;
  const uploadDir = path.join(process.cwd(), "uploads", "projects", projectId);

  fs.mkdirSync(uploadDir, { recursive: true });

  const buffer = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await (file as File).arrayBuffer());
  const filePath = path.join(process.cwd(), "uploads", fileKey);

  fs.writeFileSync(filePath, buffer);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    fileUrl: `${appUrl}/api/files/${fileKey}`,
    fileKey,
  };
}

/**
 * Remove um arquivo do Supabase Storage ou do disco local pelo fileKey.
 */
export async function deleteDocument(fileKey: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const filePath = path.join(process.cwd(), "uploads", fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .remove([fileKey]);

  if (error) {
    throw new Error(`Erro ao remover arquivo: ${error.message}`);
  }
}
