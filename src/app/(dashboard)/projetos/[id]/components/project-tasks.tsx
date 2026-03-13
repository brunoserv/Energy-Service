"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  assignedTo: { id: string; name: string } | null;
}

interface User {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  tasks: Task[];
  users: User[];
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  COMPLETED: <Check className="w-3.5 h-3.5 text-emerald-500" />,
  CANCELLED: <X className="w-3.5 h-3.5 text-slate-400" />,
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export function ProjectTasks({ projectId, tasks, users }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);

    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate || undefined,
      }),
    });

    setSaving(false);
    setOpen(false);
    setTitle("");
    setDescription("");
    setAssignedToId("");
    setDueDate("");
    router.refresh();
  }

  async function toggleStatus(task: Task) {
    const next =
      task.status === "PENDING"
        ? "IN_PROGRESS"
        : task.status === "IN_PROGRESS"
        ? "COMPLETED"
        : "PENDING";

    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, status: next }),
    });
    router.refresh();
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Tarefas ({tasks.length})
          </h2>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-slate-400 text-sm px-5 py-5 text-center">
              Nenhuma tarefa criada.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <button
                  onClick={() => toggleStatus(task)}
                  className="mt-0.5 flex-shrink-0"
                  title={`Status: ${statusLabels[task.status]}`}
                >
                  {statusIcons[task.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.status === "COMPLETED"
                        ? "line-through text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {task.assignedTo && <span>{task.assignedTo.name}</span>}
                    {task.dueDate && (
                      <span>
                        {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova tarefa">
        <div className="space-y-4">
          <Input
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descrição da tarefa"
          />
          <Textarea
            label="Detalhes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes opcionais..."
          />
          <Select
            label="Responsável"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            options={userOptions}
            placeholder="Nenhum"
          />
          <Input
            label="Data limite"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} loading={saving} disabled={!title.trim()}>
              Criar tarefa
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
