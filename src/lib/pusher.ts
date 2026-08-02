import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side instance: used inside server actions/API routes to broadcast
// events (e.g. "task moved") to everyone subscribed to a board's channel.
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side instance: a single shared connection per browser tab.
// Instantiating this at module scope (not inside a component) avoids
// opening a fresh WebSocket connection on every re-render.
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// Channel + event naming kept in one place so the server (which triggers
// events) and the client (which subscribes) can never drift out of sync.
export const boardChannel = (boardId: string) => `board-${boardId}`;

export const BoardEvents = {
  TASK_MOVED: 'task:moved',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
} as const;
