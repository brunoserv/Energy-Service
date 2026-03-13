import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client público (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (server-side, usa service role key — NÃO expor ao browser)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// Bucket para documentos de projetos
export const DOCUMENTS_BUCKET = "project-documents";

/**
 * Faz upload de um arquivo para o Supabase Storage.
 * Retorna a URL pública e o fileKey (caminho no bucket).
 */
export async function uploadDocument(
  file: File | Buffer,
  fileName: string,
  projectId: string,
  mimeType?: string
): Promise<{ fileUrl: string; fileKey: string }> {
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
 * Remove um arquivo do Supabase Storage pelo fileKey.
 */
export async function deleteDocument(fileKey: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .remove([fileKey]);

  if (error) {
    throw new Error(`Erro ao remover arquivo: ${error.message}`);
  }
}
