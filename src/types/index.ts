import type {
  User,
  Client,
  Project,
  ProjectStatusHistory,
  Document,
  Notification,
  Task,
  UserRole,
  SaleStatus,
  OrderStatus,
  ProjectStatus,
  SystemStatus,
  StatusCategory,
  DocumentType,
  NotificationType,
  TaskStatus,
} from "@prisma/client";

// ─────────────────────────────────────────────
// Re-exports dos enums do Prisma
// ─────────────────────────────────────────────
export type {
  UserRole,
  SaleStatus,
  OrderStatus,
  ProjectStatus,
  SystemStatus,
  StatusCategory,
  DocumentType,
  NotificationType,
  TaskStatus,
};

// ─────────────────────────────────────────────
// Tipos base com relações
// ─────────────────────────────────────────────

export type UserPublic = Omit<User, "password">;

export type ClientWithProjects = Client & {
  projects: Project[];
};

export type ProjectWithRelations = Project & {
  client: Client;
  statusHistory: ProjectStatusHistory[];
  documents: Document[];
  tasks: Task[];
  createdBy: UserPublic | null;
};

export type ProjectSummary = Project & {
  client: Pick<Client, "id" | "name" | "phone" | "email" | "portalToken">;
  _count: {
    documents: number;
    tasks: number;
  };
};

export type StatusHistoryWithUser = ProjectStatusHistory & {
  changedBy: UserPublic | null;
};

export type DocumentWithUploader = Document & {
  uploadedBy: UserPublic | null;
};

export type TaskWithRelations = Task & {
  project: Pick<Project, "id" | "name"> | null;
  assignedTo: UserPublic | null;
  createdBy: UserPublic | null;
};

// ─────────────────────────────────────────────
// Tipos para API
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Tipos para o Event Dispatcher
// ─────────────────────────────────────────────

export type EventType =
  | "status_changed"
  | "document_uploaded"
  | "task_created"
  | "homologation_completed"
  | "client_created"
  | "project_created";

export interface BaseEvent {
  type: EventType;
  timestamp: string;
  projectId?: string;
  clientId?: string;
}

export interface StatusChangedEvent extends BaseEvent {
  type: "status_changed";
  projectId: string;
  category: StatusCategory;
  previousValue: string | null;
  newValue: string;
  changedById?: string;
  notes?: string;
}

export interface DocumentUploadedEvent extends BaseEvent {
  type: "document_uploaded";
  projectId: string;
  documentId: string;
  documentName: string;
  visibleToClient: boolean;
}

export interface TaskCreatedEvent extends BaseEvent {
  type: "task_created";
  taskId: string;
  title: string;
  assignedToId?: string;
}

export interface HomologationCompletedEvent extends BaseEvent {
  type: "homologation_completed";
  projectId: string;
  clientPhone?: string;
  clientName?: string;
}

export interface ClientCreatedEvent extends BaseEvent {
  type: "client_created";
  clientId: string;
}

export interface ProjectCreatedEvent extends BaseEvent {
  type: "project_created";
  projectId: string;
  clientId: string;
}

export type AppEvent =
  | StatusChangedEvent
  | DocumentUploadedEvent
  | TaskCreatedEvent
  | HomologationCompletedEvent
  | ClientCreatedEvent
  | ProjectCreatedEvent;

// ─────────────────────────────────────────────
// Tipos de navegação / sessão
// ─────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ─────────────────────────────────────────────
// Labels de exibição
// ─────────────────────────────────────────────

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Realizado",
  DELIVERED: "Entregue",
  INSTALLING: "Instalando",
  INSTALLED: "Instalado",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  NOT_STARTED: "Não Iniciado",
  STARTED: "Iniciado",
  SUBMITTED: "Enviado",
  APPROVED: "Aprovado",
};

export const SYSTEM_STATUS_LABELS: Record<SystemStatus, string> = {
  INSPECTION_REQUESTED: "Vistoria Solicitada",
  HOMOLOGATED: "Homologado",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
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

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  SALE: "Venda",
  ORDER: "Pedido",
  PROJECT: "Projeto",
  SYSTEM: "Sistema",
};
