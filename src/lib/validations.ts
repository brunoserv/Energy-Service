import { z } from "zod";

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

// ─────────────────────────────────────────────
// Projetos
// ─────────────────────────────────────────────

export const projectSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  clientId: z.string().min(1, "Selecione um cliente"),
  power: z.coerce.number().positive("Potência deve ser positiva").optional(),
  inverterModel: z.string().optional(),
  panelModel: z.string().optional(),
  panelCount: z.coerce.number().int().positive().optional(),
  installationAddress: z.string().optional(),
  installationCity: z.string().optional(),
  notes: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// Atualização de Status
// ─────────────────────────────────────────────

export const updateStatusSchema = z.object({
  category: z.enum(["SALE", "ORDER", "PROJECT", "SYSTEM"]),
  newValue: z.string().min(1, "Selecione um status"),
  notes: z.string().optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ─────────────────────────────────────────────
// Documentos
// ─────────────────────────────────────────────

export const documentMetaSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum([
    "CONTRACT",
    "POWER_OF_ATTORNEY",
    "PROJECT_START_CHECKLIST",
    "INSTALLATION_START_CHECKLIST",
    "INSTALLATION_END_CHECKLIST",
    "CONFORMITY_CERTIFICATE",
    "SINGLE_LINE_DIAGRAM",
    "UTILITY_SUBMISSION",
    "OTHER",
  ]),
  visibleToClient: z.boolean().default(false),
});

export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;

// ─────────────────────────────────────────────
// Tarefas
// ─────────────────────────────────────────────

export const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

// ─────────────────────────────────────────────
// Usuários
// ─────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["ADMIN", "OPERATOR", "CLIENT"]).default("OPERATOR"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
