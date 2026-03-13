"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Client {
  id: string;
  name: string;
}

export default function NovoProjetoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = searchParams.get("clientId") ?? "";

  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("/api/clients?perPage=200")
      .then((r) => r.json())
      .then((body) => setClients(body.data ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { clientId: prefilledClientId },
  });

  async function onSubmit(data: ProjectInput) {
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao salvar projeto.");
      return;
    }

    const { data: project } = await res.json();
    router.push(`/projetos/${project.id}`);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/projetos">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo projeto</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nome do projeto *"
              placeholder="Ex: Residência João Silva"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          {/* Client select */}
          <div className="md:col-span-2">
            <label className="form-label">Cliente *</label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              {...register("clientId")}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="form-error">{errors.clientId.message}</p>
            )}
          </div>

          <Input
            label="Potência (kWp)"
            type="number"
            step="0.01"
            placeholder="5.5"
            error={errors.power?.message}
            {...register("power")}
          />
          <Input
            label="Qtd. painéis"
            type="number"
            placeholder="12"
            error={errors.panelCount?.message}
            {...register("panelCount")}
          />
          <Input
            label="Modelo do inversor"
            placeholder="Fronius Symo 5.0"
            error={errors.inverterModel?.message}
            {...register("inverterModel")}
          />
          <Input
            label="Modelo do painel"
            placeholder="Canadian Solar 450W"
            error={errors.panelModel?.message}
            {...register("panelModel")}
          />
          <div className="md:col-span-2">
            <Input
              label="Endereço da instalação"
              placeholder="Rua, número, bairro"
              error={errors.installationAddress?.message}
              {...register("installationAddress")}
            />
          </div>
          <Input
            label="Cidade da instalação"
            placeholder="São Paulo"
            error={errors.installationCity?.message}
            {...register("installationCity")}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Observações"
              placeholder="Notas sobre o projeto..."
              error={errors.notes?.message}
              {...register("notes")}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            Salvar projeto
          </Button>
          <Link href="/projetos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
