import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectStatusSection } from "./components/project-status-section";
import { ProjectDocuments } from "./components/project-documents";
import { ProjectTasks } from "./components/project-tasks";

async function getProject(id: string) {
  return db.project.findUnique({
    where: { id, active: true },
    include: {
      client: true,
      statusHistory: {
        include: {
          changedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function getUsers() {
  return db.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function ProjetoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, users] = await Promise.all([
    getProject(params.id),
    getUsers(),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projetos">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <Link
              href={`/clientes/${project.clientId}`}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {project.client.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Technical info */}
      {(project.power ||
        project.inverterModel ||
        project.panelModel ||
        project.installationCity) && (
        <div className="card p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {project.power && (
              <span>
                <span className="text-slate-400">Potência: </span>
                <strong>{project.power} kWp</strong>
              </span>
            )}
            {project.panelCount && project.panelModel && (
              <span>
                <span className="text-slate-400">Painéis: </span>
                <strong>
                  {project.panelCount}x {project.panelModel}
                </strong>
              </span>
            )}
            {project.inverterModel && (
              <span>
                <span className="text-slate-400">Inversor: </span>
                <strong>{project.inverterModel}</strong>
              </span>
            )}
            {project.installationCity && (
              <span>
                <span className="text-slate-400">Local: </span>
                <strong>{project.installationCity}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      <ProjectStatusSection project={project} />

      {/* Documents + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProjectDocuments
          projectId={project.id}
          documents={project.documents}
        />
        <ProjectTasks
          projectId={project.id}
          tasks={project.tasks}
          users={users}
        />
      </div>

      {/* History */}
      {project.statusHistory.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Histórico de status</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {project.statusHistory.map((h) => (
              <div key={h.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-400 text-xs">
                    {h.category}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-medium text-slate-900">{h.newValue}</span>
                  {h.notes && (
                    <span className="text-slate-400 hidden md:inline">— {h.notes}</span>
                  )}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{h.changedBy?.name ?? "Sistema"}</p>
                  <p>
                    {new Date(h.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
