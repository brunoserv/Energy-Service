import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/utils";

async function getClient(id: string) {
  return db.client.findUnique({
    where: { id, active: true },
    include: {
      projects: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

const systemStatusLabels: Record<string, string> = {
  INSPECTION_REQUESTED: "Vistoria Solicitada",
  HOMOLOGATED: "Homologado",
};

const systemStatusColors: Record<string, string> = {
  INSPECTION_REQUESTED: "bg-amber-100 text-amber-700",
  HOMOLOGATED: "bg-emerald-100 text-emerald-700",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  if (!client) notFound();

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/portal/${client.portalToken}`;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Dados do cliente</h2>
            <Link href={`/clientes/${client.id}/editar`}>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 text-sm">
            {client.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {formatPhone(client.phone)}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {client.email}
              </div>
            )}
            {(client.city || client.address) && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>
                  {client.address && <span className="block">{client.address}</span>}
                  {client.city && (
                    <span>
                      {client.city}
                      {client.state ? ` / ${client.state}` : ""}
                    </span>
                  )}
                </span>
              </div>
            )}
            {client.cpf && (
              <div className="text-slate-600">
                <span className="text-slate-400 text-xs">CPF: </span>
                {client.cpf}
              </div>
            )}
          </div>

          {client.notes && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              {client.notes}
            </div>
          )}

          {/* Portal link */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1.5">Link do portal do cliente</p>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir portal
            </a>
          </div>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              Projetos ({client.projects.length})
            </h2>
            <Link href={`/projetos/novo?clientId=${client.id}`}>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Novo projeto
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {client.projects.length === 0 ? (
              <p className="text-slate-400 text-sm px-5 py-6 text-center">
                Nenhum projeto cadastrado.
              </p>
            ) : (
              client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projetos/${project.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {project.name}
                    </p>
                    {project.power && (
                      <p className="text-xs text-slate-500">{project.power} kWp</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      systemStatusColors[project.systemStatus] ??
                      "bg-slate-100 text-slate-600"
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
    </div>
  );
}
