import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@relay.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@relay.app', hashedPassword },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Team',
      slug: `acme-${Date.now()}`,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  const board = await prisma.board.create({
    data: {
      name: 'Product Launch',
      workspaceId: workspace.id,
      columns: {
        create: [
          { name: 'Backlog', position: 0 },
          { name: 'In Progress', position: 1000 },
          { name: 'Review', position: 2000 },
          { name: 'Done', position: 3000 },
        ],
      },
    },
    include: { columns: true },
  });

  const backlog = board.columns.find((c: { name: string }) => c.name === 'Backlog')!;
  const inProgress = board.columns.find((c: { name: string }) => c.name === 'In Progress')!;

  await prisma.task.createMany({
    data: [
      {
        title: 'Draft launch announcement copy',
        description: 'Blog post + social captions for the v1 launch.',
        columnId: backlog.id,
        position: 1000,
        priority: 'MEDIUM',
        creatorId: user.id,
      },
      {
        title: 'Fix drag-and-drop jitter on Safari',
        description: 'Cards snap back briefly before settling — repro on iOS 17 Safari only.',
        columnId: inProgress.id,
        position: 1000,
        priority: 'HIGH',
        creatorId: user.id,
      },
    ],
  });

  console.log(`Seeded workspace "${workspace.name}" — board id: ${board.id}`);
  console.log('Demo login: demo@relay.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
