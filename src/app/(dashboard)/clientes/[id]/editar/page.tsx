import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ClientEditForm } from "./client-edit-form";

async function getClient(id: string) {
  return db.client.findUnique({
    where: { id, active: true },
  });
}

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  if (!client) notFound();

  return <ClientEditForm client={client} />;
}
