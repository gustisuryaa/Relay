'use client';

import { useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBoardStore, type ColumnWithTasks } from '@/hooks/useBoardStore';
import { useRealtimeBoard } from '@/hooks/useRealtimeBoard';
import { moveTask } from '@/server/actions/task.actions';
import { Column } from './Column';

export function Board({ boardId, initialColumns }: { boardId: string; initialColumns: ColumnWithTasks[] }) {
  const { columns, setColumns, addTask, updateTask, removeTask, moveTask: applyMove } =
    useBoardStore();

  // Seed the store once from server-rendered data. Using the boardId as
  // part of the effect (implicitly, via initialColumns identity on
  // navigation) avoids re-seeding on every re-render of this component.
  useEffect(() => {
    setColumns(initialColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useRealtimeBoard(boardId, { addTask, updateTask, removeTask, moveTask: applyMove });

  // A small drag threshold (8px) so clicking a card to open its detail
  // modal doesn't get misread as the start of a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // `over.id` is either a column id (dropped on empty column space) or
    // another task's id (dropped between/on cards) — dnd-kit gives us both
    // cases via the same `over` target, so we branch here.
    const targetColumn =
      columns.find((c) => c.id === overId) ?? columns.find((c) => c.tasks.some((t) => t.id === overId));
    if (!targetColumn) return;

    const siblings = targetColumn.tasks.filter((t) => t.id !== taskId);
    const overIndex = siblings.findIndex((t) => t.id === overId);
    const prevTask = overIndex === -1 ? siblings[siblings.length - 1] : siblings[overIndex - 1];
    const nextTask = overIndex === -1 ? undefined : siblings[overIndex];

    // Optimistic update first (instant local feedback), then persist.
    // If the server call fails, the next realtime sync / page refresh
    // will correct the local state — acceptable for a project board
    // where a failed move is rare and low-stakes, unlike e.g. a payment.
    applyMove({
      taskId,
      columnId: targetColumn.id,
      position:
        prevTask || nextTask
          ? ((prevTask?.position ?? 0) + (nextTask?.position ?? (prevTask?.position ?? 0) + 2000)) / 2
          : 1000,
    });

    await moveTask({
      taskId,
      targetColumnId: targetColumn.id,
      prevTaskPosition: prevTask?.position ?? null,
      nextTaskPosition: nextTask?.position ?? null,
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </DndContext>
  );
}
