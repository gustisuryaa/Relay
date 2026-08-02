'use server';

import { z } from 'zod';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { pusherServer, boardChannel, BoardEvents } from '@/lib/pusher';
import { summarizeTask } from '@/lib/ai';
import { positionBetween } from '@/lib/utils';

const createTaskSchema = z.object({
  columnId: z.string(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
});

/**
 * Every mutation in this file re-checks that the current user is a member
 * of the workspace that owns the resource, via requireBoardAccess() below.
 * We do NOT trust the client to only show boards the user has access to —
 * the client is a suggestion, the server is the boundary.
 */
async function requireBoardAccess(boardId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('UNAUTHENTICATED');

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: { include: { members: true } } },
  });
  if (!board) throw new Error('BOARD_NOT_FOUND');

  const isMember = board.workspace.members.some((m: { userId: string }) => m.userId === userId);
  if (!isMember) throw new Error('FORBIDDEN');

  return { userId, board };
}

export async function createTask(input: z.infer<typeof createTaskSchema>) {
  const { columnId, title, description } = createTaskSchema.parse(input);

  const column = await prisma.column.findUniqueOrThrow({
    where: { id: columnId },
    include: { board: true, tasks: { orderBy: { position: 'desc' }, take: 1 } },
  });
  const { userId } = await requireBoardAccess(column.board.id);

  const lastTask = column.tasks[0];
  const task = await prisma.task.create({
    data: {
      title,
      description,
      columnId,
      creatorId: userId,
      position: positionBetween(lastTask ? lastTask.position : null, null),
    },
  });

  await pusherServer.trigger(boardChannel(column.board.id), BoardEvents.TASK_CREATED, task);
  return task;
}

const moveTaskSchema = z.object({
  taskId: z.string(),
  targetColumnId: z.string(),
  prevTaskPosition: z.number().nullable(),
  nextTaskPosition: z.number().nullable(),
});

/**
 * Handles both reordering within a column and moving across columns — a
 * drag-and-drop board really only has one operation, "place this task
 * between these two neighbors in this column," so the two cases share
 * this single function rather than being modeled separately.
 */
export async function moveTask(input: z.infer<typeof moveTaskSchema>) {
  const { taskId, targetColumnId, prevTaskPosition, nextTaskPosition } =
    moveTaskSchema.parse(input);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { column: { include: { board: true } } },
  });
  await requireBoardAccess(task.column.board.id);

  const newPosition = positionBetween(prevTaskPosition, nextTaskPosition);
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { columnId: targetColumnId, position: newPosition },
  });

  await pusherServer.trigger(boardChannel(task.column.board.id), BoardEvents.TASK_MOVED, {
    taskId: updated.id,
    columnId: targetColumnId,
    position: newPosition,
  });

  return updated;
}

export async function regenerateTaskSummary(taskId: string) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      column: { include: { board: true } },
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  await requireBoardAccess(task.column.board.id);

  const aiSummary = await summarizeTask({
    title: task.title,
    description: task.description,
    comments: task.comments.map((c: { author: { name: string | null }; body: string }) => ({
      author: c.author.name ?? 'Unknown',
      body: c.body,
    })),
  });

  const updated = await prisma.task.update({ where: { id: taskId }, data: { aiSummary } });

  await pusherServer.trigger(boardChannel(task.column.board.id), BoardEvents.TASK_UPDATED, updated);
  return updated;
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { column: { include: { board: true } } },
  });
  await requireBoardAccess(task.column.board.id);

  await prisma.task.delete({ where: { id: taskId } });

  await pusherServer.trigger(boardChannel(task.column.board.id), BoardEvents.TASK_DELETED, {
    taskId,
  });
}
