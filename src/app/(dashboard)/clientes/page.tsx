import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Phone, Mail, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/utils";

async function getClients(search: string) {
  return db.client.findMany({
    where: search
      ? {
          active: true,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : { active: true },
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams.search ?? "";
  const clients = await getClients(search);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado
            {clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-400">Nenhum cliente encontrado.</p>
          <Link href="/clientes/novo" className="mt-3 inline-block">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Adicionar primeiro cliente
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nome
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Contato
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                  Cidade
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Projetos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/clientes/${client.id}`}
                      className="font-medium text-slate-900 hover:text-amber-600 transition-colors"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3 h-3" />
                          <span>{client.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">
                    {client.city
                      ? `${client.city}${client.state ? ` / ${client.state}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>{client._count.projects}</span>
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
