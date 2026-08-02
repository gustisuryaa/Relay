import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '@/hooks/useBoardStore';
import type { Task } from '@prisma/client';

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-1',
    title: 'Test task',
    description: null,
    aiSummary: null,
    priority: 'MEDIUM',
    position: 1000,
    columnId: 'col-a',
    assigneeId: null,
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Task;

describe('useBoardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({
      columns: [
        { id: 'col-a', name: 'Backlog', position: 0, tasks: [makeTask()] },
        { id: 'col-b', name: 'In Progress', position: 1000, tasks: [] },
      ],
    });
  });

  it('moves a task from one column to another and removes it from the source', () => {
    useBoardStore.getState().moveTask({ taskId: 'task-1', columnId: 'col-b', position: 500 });

    const { columns } = useBoardStore.getState();
    const colA = columns.find((c) => c.id === 'col-a')!;
    const colB = columns.find((c) => c.id === 'col-b')!;

    expect(colA.tasks).toHaveLength(0);
    expect(colB.tasks).toHaveLength(1);
    expect(colB.tasks[0].id).toBe('task-1');
    expect(colB.tasks[0].position).toBe(500);
  });

  it('is a no-op when moving a task id that does not exist', () => {
    const before = useBoardStore.getState().columns;
    useBoardStore.getState().moveTask({ taskId: 'ghost', columnId: 'col-b', position: 1 });
    const after = useBoardStore.getState().columns;

    expect(after).toEqual(before);
  });

  it('keeps tasks within a column sorted by position after a move', () => {
    useBoardStore.setState((state) => ({
      columns: state.columns.map((c) =>
        c.id === 'col-b' ? { ...c, tasks: [makeTask({ id: 'task-2', columnId: 'col-b', position: 2000 })] } : c
      ),
    }));

    useBoardStore.getState().moveTask({ taskId: 'task-1', columnId: 'col-b', position: 1000 });

    const colB = useBoardStore.getState().columns.find((c) => c.id === 'col-b')!;
    expect(colB.tasks.map((t) => t.id)).toEqual(['task-1', 'task-2']);
  });
});
