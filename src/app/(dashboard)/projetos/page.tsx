import { db } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getProjects(search: string) {
  return db.project.findMany({
    where: search
      ? {
          active: true,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : { active: true },
    include: {
      client: { select: { name: true } },
      _count: { select: { documents: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

const saleLabels: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
};
const orderLabels: Record<string, string> = {
  PLACED: "Realizado",
  DELIVERED: "Entregue",
  INSTALLING: "Instalando",
  INSTALLED: "Instalado",
};
const projectLabels: Record<string, string> = {
  NOT_STARTED: "Não Iniciado",
  STARTED: "Iniciado",
  SUBMITTED: "Enviado",
  APPROVED: "Aprovado",
};
const systemLabels: Record<string, string> = {
  INSPECTION_REQUESTED: "Vistoria Solicitada",
  HOMOLOGATED: "Homologado",
};

function StatusDot({ status }: { status: string }) {
  const done = ["COMPLETED", "INSTALLED", "APPROVED", "HOMOLOGATED"].includes(status);
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${done ? "bg-emerald-500" : "bg-amber-400"}`}
    />
  );
}

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams.search ?? "";
  const projects = await getProjects(search);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projetos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projetos/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo projeto
          </Button>
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por projeto ou cliente..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {projects.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-400">Nenhum projeto encontrado.</p>
          <Link href="/projetos/novo" className="mt-3 inline-block">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Criar primeiro projeto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Projeto / Cliente
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Venda
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Pedido
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                  Projeto
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Sistema
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/projetos/${project.id}`}
                      className="font-medium text-slate-900 hover:text-amber-600 transition-colors block"
                    >
                      {project.name}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {project.client.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <StatusDot status={project.saleStatus} />
                      {saleLabels[project.saleStatus]}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <StatusDot status={project.orderStatus} />
                      {orderLabels[project.orderStatus]}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <StatusDot status={project.projectStatus} />
                      {projectLabels[project.projectStatus]}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <StatusDot status={project.systemStatus} />
                      {systemLabels[project.systemStatus]}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
