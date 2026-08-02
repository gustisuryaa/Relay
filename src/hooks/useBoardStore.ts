import { create } from 'zustand';
import type { Task } from '@prisma/client';

export type ColumnWithTasks = {
  id: string;
  name: string;
  position: number;
  tasks: Task[];
};

type BoardState = {
  columns: ColumnWithTasks[];
  setColumns: (columns: ColumnWithTasks[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  moveTask: (payload: { taskId: string; columnId: string; position: number }) => void;
};

/**
 * Client-side mirror of the board's columns+tasks. Seeded once from the
 * server component via setColumns(), then kept in sync two ways:
 *   1. Optimistically, when THIS user drags a card (instant feedback).
 *   2. Via useRealtimeBoard, when ANY user (including this one) moves a
 *      card and the Pusher event round-trips back.
 * Both paths funnel through the same moveTask()/addTask()/etc. mutators
 * so the update logic only exists once.
 */
export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns }),

  addTask: (task) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === task.columnId ? { ...col, tasks: [...col.tasks, task] } : col
      ),
    })),

  updateTask: (task) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
      })),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      })),
    })),

  moveTask: ({ taskId, columnId, position }) =>
    set((state) => {
      // Pull the task out of whichever column currently holds it...
      let moved: Task | undefined;
      const withoutTask = state.columns.map((col) => {
        const found = col.tasks.find((t) => t.id === taskId);
        if (found) moved = found;
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
      });
      if (!moved) return state;

      // ...then reinsert it into the target column at the right sort
      // position, keeping the column's tasks array sorted so the UI
      // never needs a separate re-sort pass on every render.
      const updatedTask = { ...moved, columnId, position };
      return {
        columns: withoutTask.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, updatedTask].sort((a, b) => a.position - b.position) }
            : col
        ),
      };
    }),
}));
