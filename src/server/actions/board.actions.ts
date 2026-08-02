'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED');
  return session.user.id;
}

/**
 * Fetches a board with everything the client needs to render it in one
 * round trip: columns ordered left-to-right, each with its tasks ordered
 * top-to-bottom, each task with its assignee. Avoids N+1 waterfalls where
 * the client would otherwise fetch columns, then fetch tasks per column.
 */
export async function getBoardWithColumns(boardId: string) {
  const userId = await requireUserId();

  const board = await prisma.board.findUniqueOrThrow({
    where: { id: boardId },
    include: {
      workspace: { include: { members: true } },
      columns: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            orderBy: { position: 'asc' },
            include: { assignee: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
  });

  const isMember = board.workspace.members.some((m: { userId: string }) => m.userId === userId);
  if (!isMember) throw new Error('FORBIDDEN');

  return board;
}

const createBoardSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  // Default columns mirror a typical dev workflow; the user can rename or
  // add/remove columns after creation — this is just a sane starting point
  // so a new board isn't a blank, intimidating page.
  columnNames: z.array(z.string()).default(['Backlog', 'In Progress', 'Review', 'Done']),
});

export async function createBoard(input: z.infer<typeof createBoardSchema>) {
  const userId = await requireUserId();
  const { workspaceId, name, columnNames } = createBoardSchema.parse(input);

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new Error('FORBIDDEN');

  return prisma.board.create({
    data: {
      name,
      workspaceId,
      columns: {
        create: columnNames.map((colName, index) => ({
          name: colName,
          position: index * 1000, // wide gaps so columns can be reordered later without renumbering
        })),
      },
    },
    include: { columns: true },
  });
}
