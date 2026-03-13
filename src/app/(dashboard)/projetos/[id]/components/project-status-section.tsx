"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  id: string;
  saleStatus: string;
  orderStatus: string;
  projectStatus: string;
  systemStatus: string;
}

const stages = [
  {
    key: "SALE" as const,
    label: "Venda",
    field: "saleStatus" as keyof Project,
    options: [
      { value: "CONFIRMED", label: "Confirmada" },
      { value: "COMPLETED", label: "Concluída" },
    ],
  },
  {
    key: "ORDER" as const,
    label: "Pedido",
    field: "orderStatus" as keyof Project,
    options: [
      { value: "PLACED", label: "Realizado" },
      { value: "DELIVERED", label: "Entregue" },
      { value: "INSTALLING", label: "Instalando" },
      { value: "INSTALLED", label: "Instalado" },
    ],
  },
  {
    key: "PROJECT" as const,
    label: "Projeto",
    field: "projectStatus" as keyof Project,
    options: [
      { value: "NOT_STARTED", label: "Não Iniciado" },
      { value: "STARTED", label: "Iniciado" },
      { value: "SUBMITTED", label: "Enviado" },
      { value: "APPROVED", label: "Aprovado" },
    ],
  },
  {
    key: "SYSTEM" as const,
    label: "Sistema",
    field: "systemStatus" as keyof Project,
    options: [
      { value: "INSPECTION_REQUESTED", label: "Vistoria Solicitada" },
      { value: "HOMOLOGATED", label: "Homologado" },
    ],
  },
];

const doneValues = ["COMPLETED", "INSTALLED", "APPROVED", "HOMOLOGATED"];

function getLabel(field: keyof Project, value: string) {
  const stage = stages.find((s) => s.field === field);
  return stage?.options.find((o) => o.value === value)?.label ?? value;
}

interface Props {
  project: Project;
}

export function ProjectStatusSection({ project }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<(typeof stages)[0] | null>(null);
  const [newValue, setNewValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function openModal(stage: (typeof stages)[0]) {
    setActiveStage(stage);
    setNewValue(project[stage.field] as string);
    setNotes("");
    setOpen(true);
  }

  async function handleSave() {
    if (!activeStage || !newValue) return;
    setLoading(true);

    await fetch(`/api/projects/${project.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: activeStage.key,
        newValue,
        notes: notes || undefined,
      }),
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Status do projeto</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const value = project[stage.field] as string;
            const done = doneValues.includes(value);
            const label = getLabel(stage.field, value);

            return (
              <button
                key={stage.key}
                onClick={() => openModal(stage)}
                className="text-left rounded-xl border-2 border-slate-100 hover:border-amber-300 p-3.5 transition-all group"
              >
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  {stage.label}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      done ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {label}
                  </p>
                </div>
                <p className="text-xs text-amber-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Alterar →
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeStage && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={`Atualizar — ${activeStage.label}`}
        >
          <div className="space-y-4">
            <Select
              label="Novo status"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              options={activeStage.options}
            />
            <Textarea
              label="Observação (opcional)"
              placeholder="Detalhes sobre esta mudança..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} loading={loading}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
