import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Users, FolderKanban, CheckSquare, Sun } from "lucide-react";

async function getStats() {
  const [clients, projects, tasks, homologated] = await Promise.all([
    db.client.count({ where: { active: true } }),
    db.project.count({ where: { active: true } }),
    db.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    db.project.count({
      where: { active: true, systemStatus: "HOMOLOGATED" },
    }),
  ]);
  return { clients, projects, tasks, homologated };
}

async function getRecentProjects() {
  return db.project.findMany({
    where: { active: true },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PLACED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-purple-100 text-purple-700",
  INSTALLING: "bg-orange-100 text-orange-700",
  INSTALLED: "bg-emerald-100 text-emerald-700",
  NOT_STARTED: "bg-slate-100 text-slate-600",
  STARTED: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  INSPECTION_REQUESTED: "bg-amber-100 text-amber-700",
  HOMOLOGATED: "bg-emerald-100 text-emerald-700",
};

const systemStatusLabels: Record<string, string> = {
  INSPECTION_REQUESTED: "Vistoria Solicitada",
  HOMOLOGATED: "Homologado",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const [stats, recentProjects] = await Promise.all([
    getStats(),
    getRecentProjects(),
  ]);

  const cards = [
    {
      label: "Clientes",
      value: stats.clients,
      icon: Users,
      href: "/clientes",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Projetos ativos",
      value: stats.projects,
      icon: FolderKanban,
      href: "/projetos",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Tarefas pendentes",
      value: stats.tasks,
      icon: CheckSquare,
      href: "/tarefas",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Homologados",
      value: stats.homologated,
      icon: Sun,
      href: "/projetos",
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {session?.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Aqui está o resumo do dia.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Projetos recentes</h2>
          <Link
            href="/projetos"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentProjects.length === 0 ? (
            <p className="text-slate-400 text-sm px-5 py-6 text-center">
              Nenhum projeto cadastrado ainda.
            </p>
          ) : (
            recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {project.name}
                  </p>
                  <p className="text-xs text-slate-500">{project.client.name}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    statusColors[project.systemStatus] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {systemStatusLabels[project.systemStatus] ?? project.systemStatus}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
