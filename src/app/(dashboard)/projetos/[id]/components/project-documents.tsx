"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatBytes } from "@/lib/utils";

const DOC_TYPES = [
  { value: "CONTRACT", label: "Contrato" },
  { value: "POWER_OF_ATTORNEY", label: "Procuração" },
  { value: "PROJECT_START_CHECKLIST", label: "Checklist — Início do Projeto" },
  { value: "INSTALLATION_START_CHECKLIST", label: "Checklist — Início da Instalação" },
  { value: "INSTALLATION_END_CHECKLIST", label: "Checklist — Fim da Instalação" },
  { value: "CONFORMITY_CERTIFICATE", label: "Atestado de Conformidade" },
  { value: "SINGLE_LINE_DIAGRAM", label: "Diagrama Unifilar" },
  { value: "UTILITY_SUBMISSION", label: "Documentos — Concessionária" },
  { value: "OTHER", label: "Outro" },
];

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  visibleToClient: boolean;
  createdAt: Date;
  uploadedBy: { id: string; name: string } | null;
}

interface Props {
  projectId: string;
  documents: Document[];
}

export function ProjectDocuments({ projectId, documents }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("OTHER");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload() {
    if (!file || !name) return;
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    form.append("type", type);
    form.append("visibleToClient", String(visibleToClient));

    await fetch(`/api/projects/${projectId}/documents`, {
      method: "POST",
      body: form,
    });

    setUploading(false);
    setOpen(false);
    setFile(null);
    setName("");
    setType("OTHER");
    setVisibleToClient(false);
    router.refresh();
  }

  async function handleDelete(docId: string) {
    if (!confirm("Remover este documento?")) return;
    setDeleting(docId);
    await fetch(`/api/projects/${projectId}/documents/${docId}`, {
      method: "DELETE",
    });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Documentos ({documents.length})
          </h2>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Upload className="w-3.5 h-3.5" />
            Enviar
          </Button>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-slate-400 text-sm px-5 py-5 text-center">
              Nenhum documento enviado.
            </p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                      {doc.size ? ` · ${formatBytes(doc.size)}` : ""}
                      {doc.visibleToClient && (
                        <span className="ml-1.5 text-emerald-600">· Visível ao cliente</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Enviar documento">
        <div className="space-y-4">
          <div>
            <label className="form-label">Arquivo *</label>
            <input
              ref={fileRef}
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-medium hover:file:bg-amber-100 cursor-pointer"
            />
          </div>

          <Input
            label="Nome do documento *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Contrato assinado"
          />

          <Select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={DOC_TYPES}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visibleToClient"
              checked={visibleToClient}
              onChange={(e) => setVisibleToClient(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="visibleToClient" className="text-sm text-slate-700">
              Visível no portal do cliente
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpload} loading={uploading} disabled={!file}>
              Enviar documento
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
