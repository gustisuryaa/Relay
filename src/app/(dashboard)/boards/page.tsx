import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function BoardsIndexPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect('/login');
  }

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: { boards: true },
  });

  return (
    <main className="grid-paper min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-ink">Your boards</h1>

        {workspaces.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            You&apos;re not a member of any workspace yet. Run{' '}
            <code className="rounded-card bg-surface px-1.5 py-0.5 font-mono text-xs">
              npm run db:seed
            </code>{' '}
            for a demo workspace, or create one via the API.
          </p>
        )}

        {workspaces.map((workspace: { id: string; name: string; boards: { id: string; name: string }[] }) => (
          <div key={workspace.id} className="mt-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted">
              {workspace.name}
            </p>
            <div className="flex flex-col gap-2">
              {workspace.boards.map((board: { id: string; name: string }) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="rounded-card border border-line bg-surface p-4 text-sm text-ink transition hover:border-amber/40"
                >
                  {board.name}
                </Link>
              ))}
              {workspace.boards.length === 0 && (
                <p className="text-xs text-muted">No boards in this workspace yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
