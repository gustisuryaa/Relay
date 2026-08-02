'use client';

import { useState } from 'react';
import type { Task } from '@prisma/client';
import { deleteTask } from '@/server/actions/task.actions';

export function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(task.aiSummary);

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (!res.ok) throw new Error('Summarize request failed');
      const updated = await res.json();
      setSummary(updated.aiSummary);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleDelete() {
    await deleteTask(task.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-card border border-line bg-surface-raised p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="font-mono text-xs text-muted">#{task.id.slice(-6).toUpperCase()}</span>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <h2 className="font-display text-lg text-ink">{task.title}</h2>
        {task.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{task.description}</p>
        )}

        <div className="mt-5 rounded-card border border-line bg-bg/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-teal">
              AI Summary
            </span>
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="text-[10px] text-muted hover:text-teal disabled:opacity-50"
            >
              {summarizing ? 'Generating…' : summary ? 'Regenerate' : 'Generate'}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-ink">
            {summary || 'No summary yet — generate one from the task description and comment thread.'}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="mt-6 text-xs text-urgent/80 hover:text-urgent"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}
