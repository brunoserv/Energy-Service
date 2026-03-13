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

export default function NovoClientePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({ resolver: zodResolver(clientSchema) });

  async function onSubmit(data: ClientInput) {
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao salvar cliente.");
      return;
    }

    const { data: client } = await res.json();
    router.push(`/clientes/${client.id}`);
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo cliente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nome completo *"
              placeholder="João da Silva"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            placeholder="joao@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Telefone / WhatsApp"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            error={errors.cpf?.message}
            {...register("cpf")}
          />
          <Input
            label="CEP"
            placeholder="00000-000"
            error={errors.zipCode?.message}
            {...register("zipCode")}
          />
          <div className="md:col-span-2">
            <Input
              label="Endereço"
              placeholder="Rua, número, bairro"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
          <Input
            label="Cidade"
            placeholder="São Paulo"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Estado"
            placeholder="SP"
            error={errors.state?.message}
            {...register("state")}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Observações"
              placeholder="Informações adicionais sobre o cliente..."
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
            Salvar cliente
          </Button>
          <Link href="/clientes">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
