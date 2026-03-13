import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Zap, FileText, ExternalLink, CheckCircle2, Circle } from "lucide-react";

async function getPortalData(token: string) {
  return db.client.findUnique({
    where: { portalToken: token, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      projects: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          saleStatus: true,
          orderStatus: true,
          projectStatus: true,
          systemStatus: true,
          power: true,
          inverterModel: true,
          panelModel: true,
          panelCount: true,
          installationCity: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              category: true,
              newValue: true,
              notes: true,
              createdAt: true,
            },
          },
          documents: {
            where: { visibleToClient: true },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              type: true,
              fileUrl: true,
              size: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

const journeySteps = [
  {
    category: "SALE",
    label: "Venda",
    steps: [
      { value: "CONFIRMED", label: "Confirmada" },
      { value: "COMPLETED", label: "Concluída" },
    ],
  },
  {
    category: "ORDER",
    label: "Equipamentos",
    steps: [
      { value: "PLACED", label: "Pedido Realizado" },
      { value: "DELIVERED", label: "Entregue" },
      { value: "INSTALLING", label: "Em Instalação" },
      { value: "INSTALLED", label: "Instalado" },
    ],
  },
  {
    category: "PROJECT",
    label: "Documentação",
    steps: [
      { value: "NOT_STARTED", label: "Não Iniciado" },
      { value: "STARTED", label: "Iniciado" },
      { value: "SUBMITTED", label: "Enviado à Concessionária" },
      { value: "APPROVED", label: "Aprovado" },
    ],
  },
  {
    category: "SYSTEM",
    label: "Sistema",
    steps: [
      { value: "INSPECTION_REQUESTED", label: "Vistoria Solicitada" },
      { value: "HOMOLOGATED", label: "Homologado ✓" },
    ],
  },
];

const docTypeLabels: Record<string, string> = {
  CONTRACT: "Contrato",
  POWER_OF_ATTORNEY: "Procuração",
  PROJECT_START_CHECKLIST: "Checklist — Início do Projeto",
  INSTALLATION_START_CHECKLIST: "Checklist — Início da Instalação",
  INSTALLATION_END_CHECKLIST: "Checklist — Fim da Instalação",
  CONFORMITY_CERTIFICATE: "Atestado de Conformidade",
  SINGLE_LINE_DIAGRAM: "Diagrama Unifilar",
  UTILITY_SUBMISSION: "Documentos — Concessionária",
  OTHER: "Outro",
};

function getCategoryStatus(
  project: NonNullable<Awaited<ReturnType<typeof getPortalData>>>["projects"][0],
  category: string
) {
  switch (category) {
    case "SALE":
      return project.saleStatus;
    case "ORDER":
      return project.orderStatus;
    case "PROJECT":
      return project.projectStatus;
    case "SYSTEM":
      return project.systemStatus;
    default:
      return "";
  }
}

export default async function PortalPage({
  params,
}: {
  params: { token: string };
}) {
  const client = await getPortalData(params.token);
  if (!client) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Energy Service</p>
            <p className="text-slate-400 text-xs">Portal do Cliente</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {client.name.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 mt-1">
            Acompanhe o progresso do seu projeto de energia solar.
          </p>
        </div>

        {client.projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400">
              Nenhum projeto cadastrado ainda. Em breve você terá atualizações aqui.
            </p>
          </div>
        ) : (
          client.projects.map((project) => (
            <div key={project.id} className="space-y-4">
              {/* Project header */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-slate-600">
                  {project.power && <span>{project.power} kWp</span>}
                  {project.panelCount && project.panelModel && (
                    <span>
                      {project.panelCount}x {project.panelModel}
                    </span>
                  )}
                  {project.inverterModel && <span>{project.inverterModel}</span>}
                  {project.installationCity && <span>{project.installationCity}</span>}
                </div>
              </div>

              {/* Journey */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Jornada do projeto
                </h3>
                <div className="space-y-5">
                  {journeySteps.map((stage) => {
                    const currentValue = getCategoryStatus(project, stage.category);
                    const currentIndex = stage.steps.findIndex(
                      (s) => s.value === currentValue
                    );

                    return (
                      <div key={stage.category}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          {stage.label}
                        </p>
                        <div className="space-y-1.5">
                          {stage.steps.map((step, idx) => {
                            const done = idx < currentIndex;
                            const current = idx === currentIndex;

                            return (
                              <div
                                key={step.value}
                                className={`flex items-center gap-2.5 text-sm rounded-lg px-3 py-2 ${
                                  current
                                    ? "bg-amber-50 border border-amber-200"
                                    : done
                                    ? "text-slate-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                ) : current ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  </div>
                                ) : (
                                  <Circle className="w-4 h-4 flex-shrink-0" />
                                )}
                                <span
                                  className={
                                    current
                                      ? "font-semibold text-amber-700"
                                      : done
                                      ? "line-through"
                                      : ""
                                  }
                                >
                                  {step.label}
                                </span>
                                {current && (
                                  <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                    Atual
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Documents */}
              {project.documents.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Documentos disponíveis
                  </h3>
                  <div className="space-y-2">
                    {project.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {doc.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {docTypeLabels[doc.type] ?? doc.type}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent history */}
              {project.statusHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Atualizações recentes
                  </h3>
                  <div className="space-y-2">
                    {project.statusHistory.slice(0, 5).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-700 font-medium">{h.newValue}</p>
                          {h.notes && (
                            <p className="text-slate-400 text-xs mt-0.5">{h.notes}</p>
                          )}
                          <p className="text-slate-400 text-xs mt-0.5">
                            {new Date(h.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <footer className="text-center text-xs text-slate-400 py-4">
          Energy Service · Gestão de Projetos de Energia Solar
        </footer>
      </div>
    </div>
  );
}
