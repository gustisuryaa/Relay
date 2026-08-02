import { getBoardWithColumns } from '@/server/actions/board.actions';
import { Board } from '@/components/board/Board';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  // Next.js 15+ made route params async (a Promise) so the framework can
  // start streaming before params are fully resolved — must be awaited
  // here rather than destructured directly off the props object.
  const { boardId } = await params;

  // Fetched server-side so the first paint already has real data — no
  // client-side loading spinner for the initial board load. Live updates
  // after that point are handled entirely by useRealtimeBoard on the client.
  const board = await getBoardWithColumns(boardId);

  return (
    <div className="grid-paper flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
            {board.workspace.name}
          </p>
          <h1 className="font-display text-lg text-ink">{board.name}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Board boardId={board.id} initialColumns={board.columns} />
      </div>
    </div>
  );
}
