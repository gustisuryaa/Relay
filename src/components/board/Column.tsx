'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnWithTasks } from '@/hooks/useBoardStore';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

export function Column({ column }: { column: ColumnWithTasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-medium uppercase tracking-wide text-muted">
          {column.name}
        </h2>
        <span className="font-mono text-xs text-muted">{column.tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-card border border-line bg-surface/40 p-2 transition-colors',
          isOver && 'border-teal/60 bg-teal/5'
        )}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <p className="mt-4 px-2 text-center text-xs text-muted">Drop a task here</p>
        )}
      </div>
    </div>
  );
}
