"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Clock, Check, X, FolderKanban } from "lucide-react";
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
  dueDate: string | null;
  project: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

interface User {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3.5 h-3.5" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5" />,
  COMPLETED: <Check className="w-3.5 h-3.5" />,
  CANCELLED: <X className="w-3.5 h-3.5" />,
};

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState("active");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  function loadTasks() {
    const params =
      filter === "mine"
        ? "?assignedToMe=true"
        : filter === "active"
        ? "?status=PENDING"
        : "";
    fetch(`/api/tasks${params}`)
      .then((r) => r.json())
      .then((b) => setTasks(b.data ?? []));
  }

  useEffect(() => {
    loadTasks();
    fetch("/api/users")
      .then((r) => r.json())
      .then((b) => setUsers(b.data ?? []));
    fetch("/api/projects?perPage=200")
      .then((r) => r.json())
      .then((b) => setProjects(b.data ?? []));
  }, [filter]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        assignedToId: assignedToId || undefined,
        projectId: projectId || undefined,
        dueDate: dueDate || undefined,
      }),
    });
    setSaving(false);
    setOpen(false);
    setTitle("");
    setDescription("");
    setAssignedToId("");
    setProjectId("");
    setDueDate("");
    loadTasks();
  }

  async function updateStatus(task: Task, status: string) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, status }),
    });
    loadTasks();
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const statusOptions = [
    { value: "PENDING", label: "Pendente" },
    { value: "IN_PROGRESS", label: "Em Andamento" },
    { value: "COMPLETED", label: "Concluída" },
    { value: "CANCELLED", label: "Cancelada" },
  ];

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tarefas</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova tarefa
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: "active", label: "Pendentes" },
            { key: "mine", label: "Minhas tarefas" },
            { key: "all", label: "Todas" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-slate-400">Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2.5">
                    <p
                      className={`text-sm font-medium ${
                        task.status === "COMPLETED"
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[task.status]
                      }`}
                    >
                      {statusIcons[task.status]}
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {task.project && (
                      <Link
                        href={`/projetos/${task.project.id}`}
                        className="flex items-center gap-1 hover:text-amber-600 transition-colors"
                      >
                        <FolderKanban className="w-3 h-3" />
                        {task.project.name}
                      </Link>
                    )}
                    {task.assignedTo && <span>{task.assignedTo.name}</span>}
                    {task.dueDate && (
                      <span>
                        até {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                <select
                  value={task.status}
                  onChange={(e) => updateStatus(task, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
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
            label="Projeto relacionado"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projectOptions}
            placeholder="Nenhum"
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
