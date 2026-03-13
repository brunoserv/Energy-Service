"use client";

import { useState, useEffect } from "react";
import { Plus, ShieldCheck, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operador",
  CLIENT: "Cliente",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-700",
  OPERATOR: "bg-blue-100 text-blue-700",
  CLIENT: "bg-slate-100 text-slate-600",
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((b) => setUsers(b.data ?? []));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate() {
    if (!name || !email || !password) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ? JSON.stringify(body.error) : "Erro ao criar usuário.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setRole("OPERATOR");
    loadUsers();
  }

  async function handleDeactivate(userId: string) {
    if (!confirm("Desativar este usuário?")) return;
    await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    });
    loadUsers();
  }

  return (
    <>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Administração
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Gestão de usuários do sistema
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo usuário
          </Button>
        </div>

        <div className="card divide-y divide-slate-100">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  {user.role === "ADMIN" ? (
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.name}
                    {!user.active && (
                      <span className="ml-2 text-xs text-slate-400">(inativo)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role]}`}
                >
                  {roleLabels[user.role]}
                </span>
                {user.active && (
                  <button
                    onClick={() => handleDeactivate(user.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desativar usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo usuário">
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
          <Input
            label="E-mail *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
          <Input
            label="Senha *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Select
            label="Papel"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "ADMIN", label: "Admin" },
              { value: "OPERATOR", label: "Operador" },
            ]}
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCreate}
              loading={saving}
              disabled={!name || !email || !password}
            >
              Criar usuário
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
