/**
 * Seed inicial: cria usuário admin e dados de demonstração.
 * Execute com: npm run db:seed
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin principal
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@energyservice.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@energyservice.com.br",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // Bruno — Comercial
  const brunoPassword = await bcrypt.hash("bruno123", 12);
  const bruno = await db.user.upsert({
    where: { email: "bruno@energyservice.com.br" },
    update: {},
    create: {
      name: "Bruno Wanzeler",
      email: "bruno@energyservice.com.br",
      password: brunoPassword,
      role: UserRole.OPERATOR,
    },
  });
  console.log(`✅ Operador criado: ${bruno.email}`);

  // Tiago — Técnico
  const tiagoPassword = await bcrypt.hash("tiago123", 12);
  const tiago = await db.user.upsert({
    where: { email: "tiago@energyservice.com.br" },
    update: {},
    create: {
      name: "Tiago Wanzeler",
      email: "tiago@energyservice.com.br",
      password: tiagoPassword,
      role: UserRole.OPERATOR,
    },
  });
  console.log(`✅ Operador criado: ${tiago.email}`);

  // Cliente de demonstração
  const client = await db.client.upsert({
    where: { cpf: "000.000.000-00" },
    update: {},
    create: {
      name: "João da Silva (Demo)",
      email: "joao@exemplo.com.br",
      phone: "11999990000",
      cpf: "000.000.000-00",
      city: "São Paulo",
      state: "SP",
      createdById: bruno.id,
    },
  });
  console.log(`✅ Cliente demo criado: ${client.name}`);

  // Projeto de demonstração
  const existing = await db.project.findFirst({
    where: { clientId: client.id },
  });

  if (!existing) {
    const project = await db.project.create({
      data: {
        name: "Instalação Residencial — João Silva",
        clientId: client.id,
        power: 5.5,
        inverterModel: "Growatt 5000TL",
        panelModel: "Jinko 550W",
        panelCount: 10,
        installationCity: "São Paulo",
        createdById: bruno.id,
        saleStatus: "CONFIRMED",
        orderStatus: "PLACED",
        projectStatus: "NOT_STARTED",
        systemStatus: "INSPECTION_REQUESTED",
      },
    });

    // Histórico inicial
    await db.projectStatusHistory.create({
      data: {
        projectId: project.id,
        category: "SALE",
        previousValue: null,
        newValue: "CONFIRMED",
        changedById: bruno.id,
        notes: "Venda confirmada no ato do contrato.",
      },
    });

    console.log(`✅ Projeto demo criado: ${project.name}`);
  }

  console.log("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
