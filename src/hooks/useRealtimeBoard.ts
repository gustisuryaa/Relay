'use client';

import { useEffect } from 'react';
import { pusherClient, boardChannel, BoardEvents } from '@/lib/pusher';
import type { Task } from '@prisma/client';

type BoardStore = {
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  moveTask: (payload: { taskId: string; columnId: string; position: number }) => void;
};

/**
 * Subscribes this browser tab to a board's Pusher channel and wires each
 * event straight into the local store. This is what makes drag-and-drop
 * moves show up on a teammate's screen without them refreshing — when
 * User A drags a card, the server action broadcasts the event, and every
 * other tab subscribed to this board receives it here within ~100-300ms.
 *
 * Deliberately does NOT apply the update if it originated from this same
 * client (see the `.bind` filtering below isn't needed in practice: Pusher
 * already excludes the triggering socket via `socket_id` exclusion on the
 * server call would be the next optimization — omitted here to keep the
 * server action simple, at the cost of one redundant local state write per
 * action performed by the user themself. Harmless, just a note for anyone
 * extending this.)
 */
export function useRealtimeBoard(boardId: string, store: BoardStore) {
  useEffect(() => {
    const channel = pusherClient.subscribe(boardChannel(boardId));

    channel.bind(BoardEvents.TASK_CREATED, (task: Task) => store.addTask(task));
    channel.bind(BoardEvents.TASK_UPDATED, (task: Task) => store.updateTask(task));
    channel.bind(BoardEvents.TASK_DELETED, ({ taskId }: { taskId: string }) =>
      store.removeTask(taskId)
    );
    channel.bind(
      BoardEvents.TASK_MOVED,
      (payload: { taskId: string; columnId: string; position: number }) =>
        store.moveTask(payload)
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(boardChannel(boardId));
    };
    // `store` is a set of stable Zustand setters; including it in the deps
    // array would re-subscribe on every render, since callers pass in a
    // new object literal each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);
}
