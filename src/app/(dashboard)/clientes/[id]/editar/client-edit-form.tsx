"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Client } from "@prisma/client";

interface Props {
  client: Client;
}

export function ClientEditForm({ client }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      cpf: client.cpf ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      zipCode: client.zipCode ?? "",
      notes: client.notes ?? "",
    },
  });

  async function onSubmit(data: ClientInput) {
    setError("");
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao salvar cliente.");
      return;
    }

    router.push(`/clientes/${client.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${client.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar cliente</h1>
          <p className="text-sm text-slate-500">{client.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nome completo *"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Telefone / WhatsApp"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="CPF"
            error={errors.cpf?.message}
            {...register("cpf")}
          />
          <Input
            label="CEP"
            error={errors.zipCode?.message}
            {...register("zipCode")}
          />
          <div className="md:col-span-2">
            <Input
              label="Endereço"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
          <Input
            label="Cidade"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Estado"
            error={errors.state?.message}
            {...register("state")}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Observações"
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
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Salvar alterações
          </Button>
          <Link href={`/clientes/${client.id}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
