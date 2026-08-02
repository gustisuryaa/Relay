'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@prisma/client';
import { cn } from '@/lib/utils';
import { TaskDetailModal } from './TaskDetailModal';

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  LOW: 'bg-teal',
  MEDIUM: 'bg-amber',
  HIGH: 'bg-amber',
  URGENT: 'bg-urgent',
};

export function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  // Signature element: cards read like index cards pinned to a drafting
  // board — a short monospace ID tag in the corner (like a drawing
  // number) plus a thin corner-bracket accent, instead of the usual
  // rounded SaaS card with a colored left-border strip.
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => !isDragging && setOpen(true)}
        className={cn(
          'group relative cursor-grab rounded-card border border-line bg-surface p-3 active:cursor-grabbing',
          'hover:border-amber/40',
          isDragging && 'opacity-40'
        )}
      >
        <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-amber/0 group-hover:border-amber/60" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-amber/0 group-hover:border-amber/60" />

        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted">
            #{task.id.slice(-6).toUpperCase()}
          </span>
          <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_COLOR[task.priority])} />
        </div>

        <p className="font-body text-sm leading-snug text-ink">{task.title}</p>

        {task.aiSummary && (
          <p className="mt-2 line-clamp-2 text-xs italic text-muted">{task.aiSummary}</p>
        )}
      </div>

      {open && <TaskDetailModal task={task} onClose={() => setOpen(false)} />}
    </>
  );
}
